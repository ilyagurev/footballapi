import { Router } from 'express'
import { state } from '../state.js'

const router = Router()

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
    Status:      match.time_elapsed || 'notstarted',
    HomeFlagUrl: home ? `${base}/flags/${match.home_team_id}.jpg` : '',
    AwayFlagUrl: away ? `${base}/flags/${match.away_team_id}.jpg` : '',
  }])
})

router.get('/lineup/home.json', (req, res) => {
  res.set('Cache-Control', 'no-store').json(state.homeLineup)
})

router.get('/lineup/away.json', (req, res) => {
  res.set('Cache-Control', 'no-store').json(state.awayLineup)
})

export default router
