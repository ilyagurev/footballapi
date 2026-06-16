import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { state } from './state.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Persisted on a Docker volume so on-air selection + delay survive restarts
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../data')
const STATE_FILE   = path.join(DATA_DIR, 'active.json')
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json')

function clampDelay(n) {
  return Math.max(0, Math.min(60, Math.round(n)))
}

export async function loadPersisted() {
  try {
    const data = JSON.parse(await fs.readFile(STATE_FILE, 'utf8'))
    return {
      activeMatchId: typeof data.activeMatchId === 'string' && data.activeMatchId ? data.activeMatchId : null,
      vmixDelaySec: Number.isFinite(data.vmixDelaySec) ? clampDelay(data.vmixDelaySec) : 0,
      matchSource: data.matchSource === 'football-data' ? 'football-data' : 'worldcup',
    }
  } catch {
    return { activeMatchId: null, vmixDelaySec: 0, matchSource: 'worldcup' }
  }
}

// Cache the full match list so a restart doesn't blank the UI while worldcup26.ir is flaky.
// source tag ensures we don't restore a stale cache when the source changes.
export async function persistMatches(matches, source) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(MATCHES_FILE, JSON.stringify({ matches, source, savedAt: new Date().toISOString() }))
  } catch (err) {
    console.warn('[persist] matches save failed:', err.message)
  }
}

export async function loadPersistedMatches(source) {
  try {
    const data = JSON.parse(await fs.readFile(MATCHES_FILE, 'utf8'))
    if (data.source && data.source !== source) return null  // cached from different source
    if (Array.isArray(data.matches) && data.matches.length) {
      console.log(`[persist] restored ${data.matches.length} matches from ${source} cache (${data.savedAt})`)
      return data.matches
    }
  } catch {}
  return null
}

// Writes the current persistable slice of state to disk (fire-and-forget safe)
export async function persistState() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(STATE_FILE, JSON.stringify({
      activeMatchId: state.activeMatchId,
      vmixDelaySec: state.vmixDelaySec,
      matchSource: state.matchSource,
      savedAt: new Date().toISOString(),
    }))
  } catch (err) {
    console.warn('[persist] save failed:', err.message)
  }
}
