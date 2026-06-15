const BASE = 'https://worldcup26.ir'

function headers() {
  const h = { 'Content-Type': 'application/json' }
  if (process.env.WC_JWT_TOKEN) {
    h['Authorization'] = `Bearer ${process.env.WC_JWT_TOKEN}`
  }
  return h
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`worldcup26.ir ${path}: HTTP ${res.status}`)
  return res.json()
}

export async function getAllMatches() {
  const data = await get('/get/games')
  return data.games || []
}

export async function getAllTeams() {
  const data = await get('/get/teams')
  return data.teams || []
}

export async function getAllStadiums() {
  const data = await get('/get/stadiums')
  return data.stadiums || []
}
