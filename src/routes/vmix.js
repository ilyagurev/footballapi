import { Router } from 'express'
import { state } from '../state.js'

const router = Router()

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

router.get('/score.json', (req, res) => {
  const { match, minute, teamsMap } = state

  if (!match) {
    return res.set('Cache-Control', 'no-store').json([])
  }

  const home = teamsMap[match.home_team_id]
  const away = teamsMap[match.away_team_id]
  const base = `${req.protocol}://${req.get('host')}`

  res.set('Cache-Control', 'no-store').json([{
    HomeTeam:    match.home_team_name_en || '',
    AwayTeam:    match.away_team_name_en || '',
    HomeCode:    home?.fifa_code || '',
    AwayCode:    away?.fifa_code || '',
    HomeScore:   String(match.home_score ?? 0),
    AwayScore:   String(match.away_score ?? 0),
    Group:       match.group || '',
    Minute:      minute != null ? String(minute) : '',
    Status:       match.time_elapsed || 'notstarted',
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
