import { state } from './state.js'
import { getAllMatches, getAllTeams, getAllStadiums } from './sources/worldcup.js'
import { getLiveMinute, getWCSquad } from './sources/footballdata.js'
import { getFlagPath } from './flags/converter.js'

const POLL_INTERVAL_MS = 10_000
const TEAMS_TTL_MS = 60 * 60_000  // teams change rarely — refresh every hour
const FAILURE_THRESHOLD = 2       // surface an error only after N consecutive bad cycles

let teamsRefreshedAt = 0
let consecutiveFailures = 0
let lastMatchCount = -1

export function startPoller() {
  poll()
  setInterval(poll, POLL_INTERVAL_MS)
}

// summer UTC offsets: Eastern = -4 (EDT), Central = -5 (CDT), Western = -7 (PDT)
const REGION_UTC_OFFSET = { Eastern: -4, Central: -5, Western: -7 }

async function poll() {
  // Each step is isolated so one source failing doesn't wipe the others.
  // Matches/teams are critical (drive the whole UI); active-match enrichment is not.
  let critical = null

  try {
    await refreshTeamsIfStale()
  } catch (err) {
    critical = err
    console.warn('[poller] teams/stadiums refresh failed:', err.message)
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
    // Debounce: don't flag the UI red on a single transient timeout — only after repeats
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
    getFlagPath(t.id, t.fifa_code, t.flag).catch(e =>
      console.warn(`[flags] team ${t.id} (${t.fifa_code}): ${e.message}`)
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
  const matches = await getAllMatches()
  state.allMatches = matches.map(m => ({
    ...m,
    home_tla: state.teamsMap[m.home_team_id]?.fifa_code,
    away_tla: state.teamsMap[m.away_team_id]?.fifa_code,
    venue_utc_offset: state.stadiumsMap[m.stadium_id]?.utcOffset ?? null,
  }))
  // Log only when the count changes — avoids flooding logs every 10s
  if (matches.length !== lastMatchCount) {
    console.log(`[poller] matches: ${matches.length}`)
    lastMatchCount = matches.length
  }
}

async function pollActiveMatch() {
  if (!state.activeMatchId) return

  // Find match in already-loaded list — no extra API call needed
  const match = state.allMatches.find(m => m.id === state.activeMatchId)
  if (!match) {
    console.warn(`[poller] active match ${state.activeMatchId} not found in list`)
    return
  }
  state.match = match

  const isLive = match.time_elapsed === 'firsthalf' || match.time_elapsed === 'secondhalf' || match.time_elapsed === 'live'
  if (isLive) {
    const homeTla = state.teamsMap[match.home_team_id]?.fifa_code
    const awayTla = state.teamsMap[match.away_team_id]?.fifa_code
    if (homeTla && awayTla) {
      // getLiveMinute already swallows its own errors and returns null —
      // keep the previous minute on a hiccup rather than blanking it
      const minute = await getLiveMinute(homeTla, awayTla)
      if (minute != null) state.minute = minute
    }
  } else {
    state.minute = null
  }

  if (state.lineupsForMatchId !== state.activeMatchId) {
    await loadLineups(match)
    state.lineupsForMatchId = state.activeMatchId
  }

  pushScoreSnapshot(match)
}

// Keep a short rolling history of score/minute so the vMix output can be
// delayed (broadcast sync). Snapshots are tagged with the match id.
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
  // keep a bit more than the max delay (60s) of history
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

// Load both squads for any match (used by preview endpoint — does not touch active state)
export async function lineupsForMatch(match) {
  const homeTla = state.teamsMap[match.home_team_id]?.fifa_code
  const awayTla = state.teamsMap[match.away_team_id]?.fifa_code
  const [home, away] = await Promise.allSettled([
    homeTla ? getOrFetchSquad(homeTla) : Promise.resolve([]),
    awayTla ? getOrFetchSquad(awayTla) : Promise.resolve([]),
  ])
  return {
    homeLineup: home.status === 'fulfilled' ? home.value : [],
    awayLineup: away.status === 'fulfilled' ? away.value : [],
  }
}
