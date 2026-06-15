import 'dotenv/config'
import express from 'express'
import { ensureCacheDir } from './flags/converter.js'
import { startPoller } from './poller.js'
import { state } from './state.js'
import vmixRoutes from './routes/vmix.js'
import flagsRoutes from './routes/flags.js'
import uiRoutes from './routes/ui.js'

const app = express()
const PORT = process.env.PORT || 3050

app.use(express.json())

app.use('/vmix', vmixRoutes)
app.use('/flags', flagsRoutes)

app.post('/api/select/:id', (req, res) => {
  const { id } = req.params
  state.activeMatchId = id
  state.lineupsForMatchId = null
  state.minute = null
  console.log('[api] selected match', id)
  res.json({ ok: true, matchId: id })
})

app.get('/api/status', (_req, res) => {
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
