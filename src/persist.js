import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Persisted on a Docker volume so the on-air selection survives restarts/redeploys
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../data')
const ACTIVE_FILE = path.join(DATA_DIR, 'active.json')

export async function loadActiveMatchId() {
  try {
    const raw = await fs.readFile(ACTIVE_FILE, 'utf8')
    const data = JSON.parse(raw)
    return typeof data.activeMatchId === 'string' && data.activeMatchId ? data.activeMatchId : null
  } catch {
    return null  // no file yet, or unreadable — start with nothing on air
  }
}

export async function saveActiveMatchId(activeMatchId) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(ACTIVE_FILE, JSON.stringify({ activeMatchId, savedAt: new Date().toISOString() }))
  } catch (err) {
    console.warn('[persist] save active match failed:', err.message)
  }
}
