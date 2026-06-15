import { state } from './state.js'
import { getAllMatches, getAllTeams } from './sources/worldcup.js'
import { getLiveMinute, getWCSquad } from './sources/footballdata.js'
import { getFlagPath } from './flags/converter.js'

const POLL_INTERVAL_MS = 10_000
const TEAMS_TTL_MS = 60 * 60_000  // teams change rarely — refresh every hour

let teamsRefreshedAt = 0

export function startPoller() {
  poll()
  setInterval(poll, POLL_INTERVAL_MS)
}

async function poll() {
  try {
    await refreshTeamsIfStale()
    await refreshMatches()
    await pollActiveMatch()
    state.lastUpdated = new Date().toISOString()
    state.lastError = null
  } catch (err) {
    console.error('[poller]', err.message)
    state.lastError = err.message
  }
}

async function refreshTeamsIfStale() {
  if (Date.now() - teamsRefreshedAt < TEAMS_TTL_MS) return

  const teams = await getAllTeams()
  const teamsMap = {}
  for (const t of teams) {
    teamsMap[t.id] = t
    getFlagPath(t.id, t.fifa_code, t.flag).catch(e =>
      console.warn(`[flags] team ${t.id} (${t.fifa_code}): ${e.message}`)
    )
  }
  state.teamsMap = teamsMap
  teamsRefreshedAt = Date.now()
  console.log(`[poller] loaded ${teams.length} teams`)
}

async function refreshMatches() {
  const matches = await getAllMatches()
  state.allMatches = matches.map(m => ({
    ...m,
    home_tla: state.teamsMap[m.home_team_id]?.fifa_code,
    away_tla: state.teamsMap[m.away_team_id]?.fifa_code,
  }))
  console.log(`[poller] refreshed ${matches.length} matches`)
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
