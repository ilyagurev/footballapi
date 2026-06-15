const BASE = 'https://api.football-data.org/v4'

function headers() {
  return { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY || '' }
}

export async function getLiveMinute(homeTla, awayTla) {
  try {
    const res = await fetch(`${BASE}/matches?status=IN_PLAY,PAUSED`, {
      headers: headers(),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const { matches = [] } = await res.json()
    const m = matches.find(m =>
      (m.homeTeam?.tla === homeTla && m.awayTeam?.tla === awayTla) ||
      (m.homeTeam?.tla === awayTla && m.awayTeam?.tla === homeTla)
    )
    return m?.minute ?? null
  } catch {
    return null
  }
}

export async function getWCSquad(tla) {
  const res = await fetch(`${BASE}/competitions/WC/teams`, {
    headers: headers(),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`football-data.org /competitions/WC/teams: HTTP ${res.status}`)
  const { teams = [] } = await res.json()

  const team = teams.find(t => t.tla === tla)
  if (!team?.squad?.length) return []

  return team.squad.map(p => ({
    Name: p.name || [p.firstName, p.lastName].filter(Boolean).join(' '),
    Position: normalizePosition(p.position),
    Number: String(p.shirtNumber || ''),
  }))
}

const POSITION_MAP = {
  Goalkeeper: 'Goalkeeper',
  Defender: 'Defender',
  Midfielder: 'Midfielder',
  Attacker: 'Forward',
  Offence: 'Forward',
}

function normalizePosition(pos) {
  return POSITION_MAP[pos] || pos || ''
}
