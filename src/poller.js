import { state } from './state.js'
import { getAllMatches, getAllTeams, getAllStadiums } from './sources/worldcup.js'
import { getLiveMinute, getWCSquad } from './sources/footballdata.js'
import { getFdMatches } from './sources/footballdata-matches.js'
import { getFlagPath } from './flags/converter.js'
import { persistMatches, loadPersistedMatches } from './persist.js'

const POLL_INTERVAL_MS = 10_000
const TEAMS_TTL_MS = 60 * 60_000  // teams change rarely — refresh every hour
const FAILURE_THRESHOLD = 2       // surface an error only after N consecutive bad cycles

let teamsRefreshedAt = 0
let consecutiveFailures = 0
let lastMatchCount = -1

export function resetTeamsCache() { teamsRefreshedAt = 0 }

export async function startPoller() {
  // Seed allMatches from disk cache so the UI is immediately useful
  // even if the primary source is flaky at startup
  const cached = await loadPersistedMatches(state.matchSource)
  if (cached) state.allMatches = cached
  poll()
  setInterval(poll, POLL_INTERVAL_MS)
}

// summer UTC offsets: Eastern = -4 (EDT), Central = -5 (CDT), Western = -7 (PDT)
const REGION_UTC_OFFSET = { Eastern: -4, Central: -5, Western: -7 }

async function poll() {
  let critical = null

  // Team/stadium refresh only needed for worldcup26.ir source
  if (state.matchSource === 'worldcup') {
    try {
      await refreshTeamsIfStale()
    } catch (err) {
      critical = err
      console.warn('[poller] teams/stadiums refresh failed:', err.message)
    }
  }

  let matchesOk = false
  try {
    await refreshMatches()
    matchesOk = true
  } catch (err) {
    critical = err
    console.warn('[poller] matches refresh failed:', err.message)
  }

  try {
    await pollActiveMatch()
  } catch (err) {
    console.warn('[poller] active-match update failed (non-critical):', err.message)
  }

  if (matchesOk) state.lastUpdated = new Date().toISOString()

  if (critical) {
    consecutiveFailures++
    if (consecutiveFailures >= FAILURE_THRESHOLD) state.lastError = critical.message
  } else {
    consecutiveFailures = 0
    state.lastError = null
  }
}

async function refreshTeamsIfStale() {
  if (Date.now() - teamsRefreshedAt < TEAMS_TTL_MS) return

  const [teams, stadiums] = await Promise.all([getAllTeams(), getAllStadiums()])

  const teamsMap = {}
  for (const t of teams) {
    teamsMap[t.id] = t
    // Use TLA (fifa_code) as the flag filename — consistent across both sources
    getFlagPath(t.fifa_code, t.fifa_code, t.flag).catch(e =>
      console.warn(`[flags] team ${t.fifa_code}: ${e.message}`)
    )
  }
  state.teamsMap = teamsMap

  const stadiumsMap = {}
  for (const s of stadiums) {
    stadiumsMap[s.id] = { ...s, utcOffset: REGION_UTC_OFFSET[s.region] ?? -5 }
  }
  state.stadiumsMap = stadiumsMap

  teamsRefreshedAt = Date.now()
  console.log(`[poller] loaded ${teams.length} teams, ${stadiums.length} stadiums`)
}

async function refreshMatches() {
  if (state.matchSource === 'football-data') {
    await refreshMatchesFd()
  } else {
    await refreshMatchesWc()
  }
}

async function refreshMatchesWc() {
  const matches = await getAllMatches()
  state.allMatches = matches.map(m => ({
    ...m,
    home_tla: state.teamsMap[m.home_team_id]?.fifa_code || '',
    away_tla: state.teamsMap[m.away_team_id]?.fifa_code || '',
    venue_utc_offset: state.stadiumsMap[m.stadium_id]?.utcOffset ?? null,
  }))
  if (matches.length !== lastMatchCount) {
    console.log(`[poller] wc matches: ${matches.length}`)
    lastMatchCount = matches.length
  }
  persistMatches(state.allMatches, 'worldcup').catch(() => {})
}

async function refreshMatchesFd() {
  const matches = await getFdMatches()
  state.allMatches = matches

  // Download flags for all teams we haven't cached yet (keyed by TLA)
  const seen = new Set()
  for (const m of matches) {
    for (const tla of [m.home_tla, m.away_tla]) {
      if (tla && !seen.has(tla)) {
        seen.add(tla)
        getFlagPath(tla, tla, null).catch(e =>
          console.warn(`[flags] ${tla}: ${e.message}`)
        )
      }
    }
  }

  if (matches.length !== lastMatchCount) {
    console.log(`[poller] fd matches: ${matches.length}`)
    lastMatchCount = matches.length
  }
  persistMatches(state.allMatches, 'football-data').catch(() => {})
}

async function pollActiveMatch() {
  if (!state.activeMatchId) return

  const match = state.allMatches.find(m => m.id === state.activeMatchId)
  if (!match) {
    console.warn(`[poller] active match ${state.activeMatchId} not found in list`)
    return
  }
  state.match = match

  const isLive = match.time_elapsed === 'firsthalf' || match.time_elapsed === 'secondhalf' || match.time_elapsed === 'live'

  if (state.matchSource === 'football-data') {
    // Minute approximation from utcDate — no extra API call needed
    if (isLive && match.utcDate) {
      const elapsed = Math.floor((Date.now() - new Date(match.utcDate).getTime()) / 60_000)
      const approx = elapsed > 60 ? elapsed - 15 : Math.min(45, elapsed)
      state.minute = Math.min(105, Math.max(1, approx))
    } else {
      state.minute = null
    }
  } else {
    // worldcup26.ir: fetch live minute from football-data.org as a cross-source lookup
    const homeTla = match.home_tla
    const awayTla = match.away_tla
    if (isLive && homeTla && awayTla) {
      const minute = await getLiveMinute(homeTla, awayTla)
      if (minute != null) state.minute = minute
    } else if (!isLive) {
      state.minute = null
    }
  }

  if (state.lineupsForMatchId !== state.activeMatchId) {
    await loadLineups(match)
    state.lineupsForMatchId = state.activeMatchId
  }

  pushScoreSnapshot(match)
}

function pushScoreSnapshot(match) {
  const now = Date.now()
  state.scoreHistory.push({
    t: now,
    matchId: state.activeMatchId,
    home_score: match.home_score,
    away_score: match.away_score,
    minute: state.minute,
    time_elapsed: match.time_elapsed,
  })
  const cutoff = now - 75_000
  state.scoreHistory = state.scoreHistory.filter(s => s.t >= cutoff)
}

async function loadLineups(match) {
  const { homeLineup, awayLineup } = await lineupsForMatch(match)
  state.homeLineup = homeLineup
  state.awayLineup = awayLineup
}

export async function getOrFetchSquad(tla) {
  if (state.squadsCache[tla]) return state.squadsCache[tla]
  const squad = await getWCSquad(tla)
  state.squadsCache[tla] = squad
  return squad
}

// Load both squads for any match (used by preview endpoint)
export async function lineupsForMatch(match) {
  // home_tla / away_tla are set by both sources
  const homeTla = match.home_tla
  const awayTla = match.away_tla
  const [home, away] = await Promise.allSettled([
    homeTla ? getOrFetchSquad(homeTla) : Promise.resolve([]),
    awayTla ? getOrFetchSquad(awayTla) : Promise.resolve([]),
  ])
  return {
    homeLineup: home.status === 'fulfilled' ? home.value : [],
    awayLineup: away.status === 'fulfilled' ? away.value : [],
  }
}
