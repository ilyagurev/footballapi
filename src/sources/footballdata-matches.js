import { fetchJsonRetry } from '../lib/http.js'

const BASE = 'https://api.football-data.org/v4'
function headers() { return { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY || '' } }

const STATUS_MAP = {
  TIMED: 'notstarted', SCHEDULED: 'notstarted',
  IN_PLAY: 'live', PAUSED: 'halftime',
  FINISHED: 'finished', SUSPENDED: 'finished',
  POSTPONED: 'notstarted', CANCELLED: 'notstarted',
}

export async function getFdMatches() {
  const { matches = [] } = await fetchJsonRetry(
    `${BASE}/competitions/WC/matches`,
    { headers: headers(), timeoutMs: 15_000, retries: 2, label: 'fd WC/matches' }
  )
  return matches.map(m => ({
    id: String(m.id),
    home_team_id: String(m.homeTeam?.id || ''),
    away_team_id: String(m.awayTeam?.id || ''),
    home_tla: m.homeTeam?.tla || '',
    away_tla: m.awayTeam?.tla || '',
    home_team_name_en: m.homeTeam?.shortName || m.homeTeam?.name || '',
    away_team_name_en: m.awayTeam?.shortName || m.awayTeam?.name || '',
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
    group: (m.group || '').replace('GROUP_', ''),
    time_elapsed: STATUS_MAP[m.status] || 'notstarted',
    utcDate: m.utcDate || null,
    local_date: null,
    venue_utc_offset: null,
    matchday: String(m.matchday || ''),
    finished: m.status === 'FINISHED' ? 'TRUE' : 'FALSE',
    stadium_id: null,
    type: m.stage === 'GROUP_STAGE' ? 'group' : 'knockout',
  }))
}
