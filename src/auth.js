import crypto from 'crypto'

// Hardcoded passwords → roles. admin can send to vMix; viewer is read-only.
const PASSWORDS = {
  artes2026admin: 'admin',
  artes2026: 'viewer',
}

// Stable secret so sessions survive redeploys. Override via env if desired.
const SECRET = process.env.AUTH_SECRET || 'artes-vmix-bridge-2026-stable-secret'
const MAX_AGE_DAYS = 30
const MAX_AGE_SEC = MAX_AGE_DAYS * 24 * 60 * 60

export function roleForPassword(password) {
  return PASSWORDS[password] || null
}

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
}

function makeToken(role) {
  const exp = Date.now() + MAX_AGE_SEC * 1000
  const payload = role + '.' + exp
  const body = Buffer.from(payload).toString('base64url')
  return body + '.' + sign(payload)
}

function readToken(token) {
  if (!token || typeof token !== 'string') return null
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  let payload
  try { payload = Buffer.from(body, 'base64url').toString('utf8') } catch { return null }
  const expected = sign(payload)
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  const [role, expStr] = payload.split('.')
  const exp = Number(expStr)
  if (!exp || Date.now() > exp) return null
  if (role !== 'admin' && role !== 'viewer') return null
  return role
}

function parseCookies(req) {
  const out = {}
  const h = req.headers.cookie
  if (!h) return out
  for (const part of h.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function getRole(req) {
  return readToken(parseCookies(req).auth)
}

export function sessionCookie(role, secure) {
  // Secure flag when the original request is HTTPS (fifa.qplc.dev via Cloudflare);
  // omitted for direct http://IP:3050 access so login still works there.
  const s = secure ? '; Secure' : ''
  return `auth=${makeToken(role)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${s}`
}

export function clearCookie() {
  return 'auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
}

export function requireAuth(req, res, next) {
  const role = getRole(req)
  if (!role) return res.status(401).json({ error: 'unauthorized' })
  req.role = role
  next()
}

export function requireAdmin(req, res, next) {
  const role = getRole(req)
  if (role !== 'admin') return res.status(403).json({ error: 'forbidden' })
  req.role = role
  next()
}
