export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Fetch JSON with retry + exponential backoff for transient failures
// (network errors, timeouts, 5xx, 429). Fails fast on other 4xx (no point retrying).
export async function fetchJsonRetry(url, opts = {}) {
  const { headers = {}, timeoutMs = 12_000, retries = 2, label = url } = opts
  let lastErr

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) })
      if (!res.ok) {
        const err = new Error(`${label}: HTTP ${res.status}`)
        // Only 5xx / 429 are worth retrying; treat other 4xx as permanent
        if (!(res.status >= 500 || res.status === 429)) err.noRetry = true
        throw err
      }
      return await res.json()
    } catch (err) {
      lastErr = err
      if (err.noRetry || attempt === retries) break
      await sleep(400 * Math.pow(2, attempt))  // 400ms, 800ms, ...
    }
  }
  throw lastErr
}
