import { Router } from 'express'
import { state } from '../state.js'

const router = Router()

// worldcup26.ir sends score as string "null" for not-started matches
function safeScore(v) { return (v == null || v === 'null') ? 0 : Number(v) || 0 }

function kickoffDubai(match) {
  // football-data.org provides utcDate (already UTC); worldcup26.ir provides local_date + offset
  if (match.utcDate) {
    try {
      return new Date(match.utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' })
    } catch { return '' }
  }
  const ld = match.local_date
  const off = match.venue_utc_offset
  if (!ld) return ''
  try {
    const [datePart, hhmm] = ld.split(' ')
    const [mm, dd, yyyy] = datePart.split('/')
    let iso
    if (off == null) {
      iso = `${yyyy}-${mm}-${dd}T${hhmm}:00Z`
    } else {
      const sign = off >= 0 ? '+' : '-'
      const abs = Math.abs(off)
      const ohh = String(Math.floor(abs)).padStart(2, '0')
      const omm = String(Math.round((abs % 1) * 60)).padStart(2, '0')
      iso = `${yyyy}-${mm}-${dd}T${hhmm}:00${sign}${ohh}:${omm}`
    }
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' })
  } catch { return '' }
}

function delayedDynamic() {
  const { match, minute, vmixDelaySec, activeMatchId } = state
  const live = {
    home_score: safeScore(match.home_score),
    away_score: safeScore(match.away_score),
    minute,
    time_elapsed: match.time_elapsed,
  }
  if (!vmixDelaySec) return live

  const target = Date.now() - vmixDelaySec * 1000
  const hist = state.scoreHistory.filter(s => s.matchId === activeMatchId)
  if (!hist.length) return live

  let snap = null
  for (const s of hist) {
    if (s.t <= target) snap = s
    else break
  }
  if (!snap) snap = hist[0]
  return {
    home_score: snap.home_score,
    away_score: snap.away_score,
    minute: snap.minute,
    time_elapsed: snap.time_elapsed,
  }
}

router.get('/score.json', (req, res) => {
  const { match } = state

  if (!match) {
    return res.set('Cache-Control', 'no-store').json([])
  }

  const base = `${req.protocol}://${req.get('host')}`
  const d = delayedDynamic()

  // Flags are cached by TLA (fifa_code) — consistent across both sources
  const homeTla = match.home_tla || ''
  const awayTla = match.away_tla || ''

  res.set('Cache-Control', 'no-store').json([{
    HomeTeam:     match.home_team_name_en || '',
    AwayTeam:     match.away_team_name_en || '',
    HomeCode:     homeTla,
    AwayCode:     awayTla,
    HomeScore:    String(safeScore(d.home_score)),
    AwayScore:    String(safeScore(d.away_score)),
    Group:        match.group || '',
    Minute:       d.minute != null ? String(d.minute) : '',
    Status:       d.time_elapsed || 'notstarted',
    KickoffDubai: kickoffDubai(match),
    HomeFlagUrl:  homeTla ? `${base}/flags/${homeTla}.jpg` : '',
    AwayFlagUrl:  awayTla ? `${base}/flags/${awayTla}.jpg` : '',
  }])
})

router.get('/lineup/home.json', (req, res) => {
  res.set('Cache-Control', 'no-store').json(state.homeLineup)
})

router.get('/lineup/away.json', (req, res) => {
  res.set('Cache-Control', 'no-store').json(state.awayLineup)
})

router.get('/lineup/home/starters.json', (req, res) => {
  res.set('Cache-Control', 'no-store').json(state.homeLineup.filter(p => p.Starter === true))
})

router.get('/lineup/home/bench.json', (req, res) => {
  res.set('Cache-Control', 'no-store').json(state.homeLineup.filter(p => p.Starter !== true))
})

router.get('/lineup/away/starters.json', (req, res) => {
  res.set('Cache-Control', 'no-store').json(state.awayLineup.filter(p => p.Starter === true))
})

router.get('/lineup/away/bench.json', (req, res) => {
  res.set('Cache-Control', 'no-store').json(state.awayLineup.filter(p => p.Starter !== true))
})

export default router
