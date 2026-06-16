import { fetchJsonRetry } from '../lib/http.js'

const BASE = 'https://v3.football.api-sports.io'
const WC_LEAGUE = 1     // FIFA World Cup
const WC_SEASON = 2026

function headers() {
  return { 'x-apisports-key': process.env.API_FOOTBALL_KEY || '' }
}

// api-football position codes → our internal labels
const POS = { G: 'Goalkeeper', D: 'Defender', M: 'Midfielder', F: 'Forward' }

function toPlayer(p, starter) {
  return {
    Name:     p.name || '',
    Number:   String(p.number || ''),
    Position: POS[p.pos] || p.pos || '',
    Starter:  starter,
  }
}

// Find the api-football fixture ID for a given match by date + team code.
// Returns { fixtureId, homeFirst } or null.
async function findFixture(match) {
  const date = match.utcDate?.slice(0, 10)
  if (!date) return null

  const data = await fetchJsonRetry(
    `${BASE}/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}&date=${date}`,
    { headers: headers(), timeoutMs: 12_000, retries: 1, label: 'api-football fixtures' }
  )

  for (const f of data.response || []) {
    const hc = f.teams.home.code   // e.g. "ESP"
    const ac = f.teams.away.code   // e.g. "CPV"
    if (hc === match.home_tla && ac === match.away_tla) {
      return { fixtureId: f.fixture.id, homeFirst: true }
    }
    if (hc === match.away_tla && ac === match.home_tla) {
      return { fixtureId: f.fixture.id, homeFirst: false }
    }
  }
  return null
}

// Fetch starting XI + bench for the given match from api-football.com.
// Returns { homeStarters, homeBench, awayStarters, awayBench } or null.
// Called only when admin puts match on-air; requires API_FOOTBALL_KEY in env.
export async function getApiFootballLineup(match) {
  if (!process.env.API_FOOTBALL_KEY) return null

  try {
    const found = await findFixture(match)
    if (!found) {
      console.warn('[api-football] no fixture found for', match.home_tla, 'vs', match.away_tla)
      return null
    }

    const data = await fetchJsonRetry(
      `${BASE}/fixtures/lineups?fixture=${found.fixtureId}`,
      { headers: headers(), timeoutMs: 12_000, retries: 1, label: 'api-football lineup' }
    )

    const teams = data.response || []
    if (teams.length < 2) return null

    // teams[0] = home in api-football order; teams[1] = away
    const homeData = found.homeFirst ? teams[0] : teams[1]
    const awayData = found.homeFirst ? teams[1] : teams[0]

    const homeStarters = (homeData?.startXI     || []).map(p => toPlayer(p.player, true))
    const homeBench    = (homeData?.substitutes  || []).map(p => toPlayer(p.player, false))
    const awayStarters = (awayData?.startXI     || []).map(p => toPlayer(p.player, true))
    const awayBench    = (awayData?.substitutes  || []).map(p => toPlayer(p.player, false))

    if (!homeStarters.length && !awayStarters.length) return null

    console.log(
      `[api-football] lineup: ${homeStarters.length}+${homeBench.length} / ${awayStarters.length}+${awayBench.length}`
    )
    return { homeStarters, homeBench, awayStarters, awayBench }
  } catch (e) {
    console.warn('[api-football] lineup error:', e.message)
    return null
  }
}
