import { Router } from 'express'
import { state } from '../state.js'

const router = Router()

// worldcup26.ir sends score as string "null" for not-started matches
function safeScore(v) { return (v == null || v === 'null') ? 0 : Number(v) || 0 }

function kickoffDubai(match) {
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

// Resolve the score/minute/status to emit, applying the broadcast delay.
// With delay > 0 we return the snapshot as it was `vmixDelaySec` ago, so the
// vMix titles stay in sync with the delayed broadcast feed.
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

  // newest snapshot at or before the target time; if none is old enough yet
  // (history still filling after selecting the match), use the oldest we have
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
  const { match, teamsMap } = state

  if (!match) {
    return res.set('Cache-Control', 'no-store').json([])
  }

  const home = teamsMap[match.home_team_id]
  const away = teamsMap[match.away_team_id]
  const base = `${req.protocol}://${req.get('host')}`
  const d = delayedDynamic()

  res.set('Cache-Control', 'no-store').json([{
    HomeTeam:    match.home_team_name_en || '',
    AwayTeam:    match.away_team_name_en || '',
    HomeCode:    home?.fifa_code || '',
    AwayCode:    away?.fifa_code || '',
    HomeScore:   String(safeScore(d.home_score)),
    AwayScore:   String(safeScore(d.away_score)),
    Group:       match.group || '',
    Minute:      d.minute != null ? String(d.minute) : '',
    Status:       d.time_elapsed || 'notstarted',
    KickoffDubai: kickoffDubai(match),
    HomeFlagUrl:  home ? `${base}/flags/${match.home_team_id}.jpg` : '',
    AwayFlagUrl:  away ? `${base}/flags/${match.away_team_id}.jpg` : '',
  }])
})

router.get('/lineup/home.json', (req, res) => {
  res.set('Cache-Control', 'no-store').json(state.homeLineup)
})

router.get('/lineup/away.json', (req, res) => {
  res.set('Cache-Control', 'no-store').json(state.awayLineup)
})

export default router
