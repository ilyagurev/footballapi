import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { FIFA_TO_ISO2 } from './iso2-map.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = path.resolve(__dirname, '../../cache/flags')

// flagcdn.com 1280px-wide PNG — high quality, no auth required
function flagcdnUrl(iso2) {
  return `https://flagcdn.com/w1280/${iso2}.png`
}

export async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true })
}

// fifaCode: team's FIFA 3-letter code (e.g. "ARG"); fallbackUrl: original team.flag from worldcup26.ir
export async function getFlagPath(teamId, fifaCode, fallbackUrl) {
  const cachePath = path.join(CACHE_DIR, `${teamId}.jpg`)

  try {
    await fs.access(cachePath)
    return cachePath
  } catch {}

  const iso2 = fifaCode && FIFA_TO_ISO2[fifaCode.toUpperCase()]
  const sourceUrl = iso2 ? flagcdnUrl(iso2) : fallbackUrl

  if (!sourceUrl) throw new Error(`No flag URL for team ${teamId} (${fifaCode})`)

  const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) {
    // fall back to original source if flagcdn.com fails
    if (iso2 && fallbackUrl && sourceUrl !== fallbackUrl) {
      const res2 = await fetch(fallbackUrl, { signal: AbortSignal.timeout(10_000) })
      if (!res2.ok) throw new Error(`Flag download ${fallbackUrl}: HTTP ${res2.status}`)
      const buf2 = Buffer.from(await res2.arrayBuffer())
      await convertAndSave(buf2, cachePath)
      return cachePath
    }
    throw new Error(`Flag download ${sourceUrl}: HTTP ${res.status}`)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  await convertAndSave(buffer, cachePath)
  return cachePath
}

async function convertAndSave(buffer, cachePath) {
  await sharp(buffer)
    .resize(800, 533, { fit: 'cover' })
    .jpeg({ quality: 92 })
    .toFile(cachePath)
}
