import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = path.resolve(__dirname, '../../cache/flags')

export async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true })
}

export async function getFlagPath(teamId, flagUrl) {
  const cachePath = path.join(CACHE_DIR, `${teamId}.jpg`)

  try {
    await fs.access(cachePath)
    return cachePath
  } catch {}

  const res = await fetch(flagUrl, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`Flag download ${flagUrl}: HTTP ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())

  await sharp(buffer)
    .resize(320, 213, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .jpeg({ quality: 85 })
    .toFile(cachePath)

  return cachePath
}
