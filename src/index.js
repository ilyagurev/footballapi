import 'dotenv/config'
import express from 'express'
import { ensureCacheDir } from './flags/converter.js'
import { startPoller, lineupsForMatch } from './poller.js'
import { state } from './state.js'
import { roleForPassword, getRole, sessionCookie, clearCookie, requireAuth, requireAdmin } from './auth.js'
import vmixRoutes from './routes/vmix.js'
import flagsRoutes from './routes/flags.js'
import uiRoutes from './routes/ui.js'

const app = express()
const PORT = process.env.PORT || 3050

app.use(express.json())

// vMix DataSources + flags are PUBLIC — the vMix machine pulls them without auth
app.use('/vmix', vmixRoutes)
app.use('/flags', flagsRoutes)

// --- Auth (hardcoded passwords → admin / viewer, 30-day cookie) ---
app.post('/api/login', (req, res) => {
  const password = (req.body && req.body.password) || ''
  const role = roleForPassword(password)
  if (!role) return res.status(401).json({ error: 'wrong password' })
  res.setHeader('Set-Cookie', sessionCookie(role))
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
  console.log('[api] selected match', id)
  res.json({ ok: true, matchId: id })
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
    lastUpdated: state.lastUpdated,
    lastError: state.lastError,
  })
})

app.use('/', uiRoutes)

async function main() {
  await ensureCacheDir()
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
