import { Router } from 'express'
import { state } from '../state.js'
import { getFlagPath } from '../flags/converter.js'

const router = Router()

router.get('/:teamId.jpg', async (req, res) => {
  const { teamId } = req.params
  const team = state.teamsMap[teamId]

  if (!team?.flag) return res.status(404).send('Team not found')

  try {
    const filePath = await getFlagPath(teamId, team.flag)
    res
      .set('Content-Type', 'image/jpeg')
      .set('Cache-Control', 'public, max-age=86400')
      .sendFile(filePath)
  } catch (err) {
    console.error(`[flags] ${teamId}:`, err.message)
    res.status(500).send('Flag conversion failed')
  }
})

export default router
