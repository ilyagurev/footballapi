import 'dotenv/config'
import express from 'express'
import { ensureCacheDir } from './flags/converter.js'
import { startPoller, lineupsForMatch } from './poller.js'
import { state } from './state.js'
import { roleForPassword, getRole, sessionCookie, clearCookie, requireAuth, requireAdmin } from './auth.js'
import { loadPersisted, persistState } from './persist.js'
import vmixRoutes from './routes/vmix.js'
import flagsRoutes from './routes/flags.js'
import uiRoutes from './routes/ui.js'

const app = express()
const PORT = process.env.PORT || 3050

// Behind Cloudflare (fifa.qplc.dev) — trust X-Forwarded-Proto/Host so
// req.protocol/req.secure reflect the original HTTPS request, not the
// internal HTTP hop. Makes flag URLs in score.json use https.
app.set('trust proxy', true)

app.use(express.json())

// vMix DataSources + flags are PUBLIC — the vMix machine pulls them without auth
app.use('/vmix', vmixRoutes)
app.use('/flags', flagsRoutes)

// --- Auth (hardcoded passwords → admin / viewer, 30-day cookie) ---
app.post('/api/login', (req, res) => {
  const password = (req.body && req.body.password) || ''
  const role = roleForPassword(password)
  if (!role) return res.status(401).json({ error: 'wrong password' })
  res.setHeader('Set-Cookie', sessionCookie(role, req.secure))
  console.log('[auth] login as', role)
  res.json({ role })
})

app.post('/api/logout', (_req, res) => {
  res.setHeader('Set-Cookie', clearCookie())
  res.json({ ok: true })
})

app.get('/api/me', (req, res) => {
  const role = getRole(req)
  if (!role) return res.status(401).json({ error: 'unauthorized' })
  res.json({ role })
})

// Sending a match to vMix requires the admin password
app.post('/api/select/:id', requireAdmin, (req, res) => {
  const { id } = req.params
  state.activeMatchId = id
  state.lineupsForMatchId = null
  state.minute = null
  state.scoreHistory = []   // new match — drop the previous match's delay buffer
  persistState()            // persist so the on-air match survives restarts
  console.log('[api] selected match', id)
  res.json({ ok: true, matchId: id })
})

// Broadcast-delay (0..60s): vMix output lags real data by this many seconds
app.post('/api/delay', requireAdmin, (req, res) => {
  const raw = Number(req.body && req.body.seconds)
  if (!Number.isFinite(raw)) return res.status(400).json({ error: 'bad seconds' })
  const seconds = Math.max(0, Math.min(60, Math.round(raw)))
  state.vmixDelaySec = seconds
  persistState()
  console.log('[api] vmix delay set to', seconds, 's')
  res.json({ ok: true, seconds })
})

// Preview a match WITHOUT sending it to vMix (read-only details + squads)
app.get('/api/preview/:id', requireAuth, async (req, res) => {
  const match = state.allMatches.find(m => m.id === req.params.id)
  if (!match) return res.status(404).json({ error: 'match not found' })
  try {
    const { homeLineup, awayLineup } = await lineupsForMatch(match)
    res.json({ match, homeLineup, awayLineup })
  } catch (err) {
    res.json({ match, homeLineup: [], awayLineup: [], error: err.message })
  }
})

app.get('/api/status', requireAuth, (_req, res) => {
  res.json({
    activeMatchId: state.activeMatchId,
    match: state.match,
    minute: state.minute,
    allMatches: state.allMatches,
    teamsMap: state.teamsMap,
    homeLineup: state.homeLineup,
    awayLineup: state.awayLineup,
    vmixDelaySec: state.vmixDelaySec,
    lastUpdated: state.lastUpdated,
    lastError: state.lastError,
  })
})

app.use('/', uiRoutes)

async function main() {
  await ensureCacheDir()

  // Restore on-air match + delay from disk so a restart/redeploy doesn't reset them
  const restored = await loadPersisted()
  if (restored.activeMatchId) {
    state.activeMatchId = restored.activeMatchId
    console.log('[persist] restored on-air match', restored.activeMatchId)
  }
  state.vmixDelaySec = restored.vmixDelaySec
  if (restored.vmixDelaySec) console.log('[persist] restored vmix delay', restored.vmixDelaySec, 's')

  startPoller()
  app.listen(PORT, () => {
    console.log(`⚽ vMix Bridge → http://localhost:${PORT}`)
    console.log(`   vMix DataSources:`)
    console.log(`     /vmix/score.json`)
    console.log(`     /vmix/lineup/home.json`)
    console.log(`     /vmix/lineup/away.json`)
  })
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
