import { fetchJsonRetry } from '../lib/http.js'

const BASE = 'https://worldcup26.ir'

function headers() {
  const h = { 'Content-Type': 'application/json' }
  if (process.env.WC_JWT_TOKEN) {
    h['Authorization'] = `Bearer ${process.env.WC_JWT_TOKEN}`
  }
  return h
}

async function get(path) {
  return fetchJsonRetry(`${BASE}${path}`, {
    headers: headers(),
    timeoutMs: 12_000,
    retries: 2,
    label: `worldcup26.ir ${path}`,
  })
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
