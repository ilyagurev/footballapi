import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { state } from './state.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Persisted on a Docker volume so on-air selection + delay survive restarts
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../data')
const STATE_FILE = path.join(DATA_DIR, 'active.json')

function clampDelay(n) {
  return Math.max(0, Math.min(60, Math.round(n)))
}

export async function loadPersisted() {
  try {
    const data = JSON.parse(await fs.readFile(STATE_FILE, 'utf8'))
    return {
      activeMatchId: typeof data.activeMatchId === 'string' && data.activeMatchId ? data.activeMatchId : null,
      vmixDelaySec: Number.isFinite(data.vmixDelaySec) ? clampDelay(data.vmixDelaySec) : 0,
    }
  } catch {
    return { activeMatchId: null, vmixDelaySec: 0 }  // no file yet / unreadable
  }
}

// Writes the current persistable slice of state to disk (fire-and-forget safe)
export async function persistState() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(STATE_FILE, JSON.stringify({
      activeMatchId: state.activeMatchId,
      vmixDelaySec: state.vmixDelaySec,
      savedAt: new Date().toISOString(),
    }))
  } catch (err) {
    console.warn('[persist] save failed:', err.message)
  }
}
