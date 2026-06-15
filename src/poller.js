import { state } from './state.js'
import { getAllMatches, getMatch, getAllTeams } from './sources/worldcup.js'
import { getLiveMinute, getWCSquad } from './sources/footballdata.js'
import { getFlagPath } from './flags/converter.js'

const POLL_INTERVAL_MS = 30_000
const MATCHES_TTL_MS = 5 * 60_000

let matchesRefreshedAt = 0

export function startPoller() {
  poll()
  setInterval(poll, POLL_INTERVAL_MS)
}

async function poll() {
  try {
    await refreshMatchesIfStale()
    await pollActiveMatch()
    state.lastUpdated = new Date().toISOString()
    state.lastError = null
  } catch (err) {
    console.error('[poller]', err.message)
    state.lastError = err.message
  }
}

async function refreshMatchesIfStale() {
  if (Date.now() - matchesRefreshedAt < MATCHES_TTL_MS) return

  const [matches, teams] = await Promise.all([getAllMatches(), getAllTeams()])

  const teamsMap = {}
  for (const t of teams) {
    teamsMap[t.id] = t
    if (t.flag) {
      getFlagPath(t.id, t.flag).catch(e =>
        console.warn(`[flags] team ${t.id}: ${e.message}`)
      )
    }
  }

  state.teamsMap = teamsMap
  state.allMatches = matches.map(m => ({
    ...m,
    home_tla: teamsMap[m.home_team_id]?.fifa_code,
    away_tla: teamsMap[m.away_team_id]?.fifa_code,
  }))

  matchesRefreshedAt = Date.now()
  console.log(`[poller] loaded ${matches.length} matches, ${teams.length} teams`)
}

async function pollActiveMatch() {
  if (!state.activeMatchId) return

  const match = await getMatch(state.activeMatchId)
  state.match = match

  const isLive = match.time_elapsed === 'firsthalf' || match.time_elapsed === 'secondhalf'
  if (isLive) {
    const homeTla = state.teamsMap[match.home_team_id]?.fifa_code
    const awayTla = state.teamsMap[match.away_team_id]?.fifa_code
    if (homeTla && awayTla) {
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
}

async function loadLineups(match) {
  const homeTla = state.teamsMap[match.home_team_id]?.fifa_code
  const awayTla = state.teamsMap[match.away_team_id]?.fifa_code

  const [home, away] = await Promise.allSettled([
    homeTla ? getOrFetchSquad(homeTla) : Promise.resolve([]),
    awayTla ? getOrFetchSquad(awayTla) : Promise.resolve([]),
  ])

  state.homeLineup = home.status === 'fulfilled' ? home.value : []
  state.awayLineup = away.status === 'fulfilled' ? away.value : []

  if (home.status === 'rejected') console.warn(`[lineups] home (${homeTla}): ${home.reason?.message}`)
  if (away.status === 'rejected') console.warn(`[lineups] away (${awayTla}): ${away.reason?.message}`)
}

async function getOrFetchSquad(tla) {
  if (state.squadsCache[tla]) return state.squadsCache[tla]
  const squad = await getWCSquad(tla)
  state.squadsCache[tla] = squad
  return squad
}
