import { Router } from 'express'
import { getFlagPath } from '../flags/converter.js'

const router = Router()

// Serve flag images by TLA (e.g. /flags/ESP.jpg).
// getFlagPath checks the disk cache first; downloads from flagcdn.com if missing.
// teamsMap is NOT consulted — filenames are always TLA-based.
router.get('/:teamId.jpg', async (req, res) => {
  const { teamId } = req.params
  try {
    const filePath = await getFlagPath(teamId, teamId, null)
    res
      .set('Content-Type', 'image/jpeg')
      .set('Cache-Control', 'public, max-age=86400')
      .sendFile(filePath)
  } catch (err) {
    console.warn(`[flags] ${teamId}:`, err.message)
    res.status(404).send('Flag not found')
  }
})

export default router
