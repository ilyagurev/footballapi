import { fetchJsonRetry } from '../lib/http.js'

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

// Cache event IDs so scoreboard doesn't need a find-step on every poll tick
const eventIdCache = new Map()  // key: "HOME_TLA:AWAY_TLA:DATE" → { eventId, homeFirst }

// ESPN uses slightly different abbreviations for a few nations
const OUR_TO_ESPN = {
  CUR: 'CUW',  // Curaçao: FD uses CUR, ESPN uses CUW
  URY: 'URU',  // Uruguay: FD uses URY, ESPN uses URU
}

function toEspnTla(tla) {
  return OUR_TO_ESPN[tla] || tla
}

// ESPN position abbreviations → internal label
const POS = {
  G: 'Goalkeeper', GK: 'Goalkeeper',
  CD: 'Defender', 'CD-L': 'Defender', 'CD-R': 'Defender',
  LB: 'Defender', RB: 'Defender', LWB: 'Defender', RWB: 'Defender', SW: 'Defender',
  DM: 'Midfielder', CM: 'Midfielder', RM: 'Midfielder', LM: 'Midfielder', AM: 'Midfielder',
  LW: 'Forward', RW: 'Forward', CF: 'Forward', SS: 'Forward', ST: 'Forward', FW: 'Forward',
}

function toPlayer(entry, starter) {
  const a = entry.athlete || {}
  const posCode = entry.position?.abbreviation || ''
  return {
    Name:     a.displayName || a.shortName || '',
    Number:   String(entry.jersey || ''),
    Position: POS[posCode] || (starter ? posCode : ''),
    Starter:  starter,
  }
}

// Return the date string (YYYY-MM-DD) to query ESPN with.
// ESPN uses US Eastern Time (UTC-4 in summer); late UTC-day matches may
// appear under the previous Eastern calendar date.
function getQueryDate(match) {
  const iso = match.utcDate?.slice(0, 10)
  if (!iso) {
    // worldcup26.ir source: derive UTC date from local_date + offset
    if (match.local_date && match.venue_utc_offset != null) {
      const ms = new Date(match.local_date).getTime() - match.venue_utc_offset * 3_600_000
      return new Date(ms).toISOString().slice(0, 10)
    }
    return null
  }
  return iso
}

function prevDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

async function fetchScoreboard(dateStr) {
  const yyyymmdd = dateStr.replace(/-/g, '')
  return fetchJsonRetry(`${BASE}/scoreboard?dates=${yyyymmdd}`, {
    timeoutMs: 10_000, retries: 1, label: 'espn scoreboard',
  })
}

// Find ESPN event ID for a match by querying scoreboard on UTC date (and day before).
// Results are cached by team+date so repeated poll calls don't re-search.
async function findEspnEvent(match) {
  const date = getQueryDate(match)
  if (!date) return null

  const homeTla = toEspnTla(match.home_tla)
  const awayTla = toEspnTla(match.away_tla)
  const cacheKey = `${homeTla}:${awayTla}:${date}`
  if (eventIdCache.has(cacheKey)) return eventIdCache.get(cacheKey)

  for (const d of [date, prevDay(date)]) {
    const data = await fetchScoreboard(d)
    for (const event of data.events || []) {
      const comps = event.competitions?.[0]
      const home = comps?.competitors?.[0]?.team?.abbreviation
      const away = comps?.competitors?.[1]?.team?.abbreviation
      if (
        (home === homeTla && away === awayTla) ||
        (home === awayTla && away === homeTla)
      ) {
        const result = { eventId: event.id, homeFirst: home === homeTla }
        eventIdCache.set(cacheKey, result)
        return result
      }
    }
  }
  eventIdCache.set(cacheKey, null)
  return null
}

// Fetch live clock + period for an active match from ESPN scoreboard.
// Returns { minute, period, halftime } or null if match not found / not live.
//   minute  — football minute (1–105)
//   period  — 1 (first half) | 2 (second half)
//   halftime — true when between halves (minute fixed at 45)
export async function getEspnMinute(match) {
  try {
    const found = await findEspnEvent(match)
    if (!found) return null

    const date = getQueryDate(match)
    const data = await fetchScoreboard(date)
    const event = (data.events || []).find(e => e.id === found.eventId)
    if (!event) return null

    const status = event.competitions?.[0]?.status || {}
    const typeName = status.type?.name || ''
    const isHalftime = typeName.includes('HALF_TIME')
    const isInProgress = typeName.includes('IN_PROGRESS')

    if (!isInProgress && !isHalftime) return null

    const period = status.period || 1
    const clock  = status.clock ?? 0   // total seconds of play elapsed

    if (isHalftime) {
      // clock holds minutes played so far — end of 1H ≈ 2700s, end of ET-1H ≈ 6300s
      const minute = Math.max(1, Math.floor(clock / 60))
      return { minute, period, halftime: true }
    }

    const minute = Math.min(120, Math.max(1, Math.floor(clock / 60)))
    return { minute, period, halftime: false }
  } catch {
    return null
  }
}

// Fetch starting XI + bench for the given match from ESPN.
// Returns { homeStarters, homeBench, awayStarters, awayBench } or null.
// No API key required — ESPN public API.
export async function getEspnLineup(match) {
  try {
    const found = await findEspnEvent(match)
    if (!found) {
      console.warn('[espn] no event found for', match.home_tla, 'vs', match.away_tla)
      return null
    }

    const data = await fetchJsonRetry(`${BASE}/summary?event=${found.eventId}`, {
      timeoutMs: 12_000, retries: 1, label: 'espn summary',
    })

    const rosters = data.rosters || []
    if (rosters.length < 2) return null

    // rosters[0] = home team per ESPN's home/away competitor order
    const homeRoster = found.homeFirst ? rosters[0] : rosters[1]
    const awayRoster = found.homeFirst ? rosters[1] : rosters[0]

    const parseRoster = (r) => {
      const players = r?.roster || []
      return {
        starters: players.filter(p => p.starter).map(p => toPlayer(p, true)),
        bench:    players.filter(p => !p.starter).map(p => toPlayer(p, false)),
      }
    }

    const home = parseRoster(homeRoster)
    const away = parseRoster(awayRoster)

    if (!home.starters.length && !away.starters.length) return null

    console.log(
      `[espn] lineup: ${home.starters.length}+${home.bench.length} / ${away.starters.length}+${away.bench.length}`
    )
    return {
      homeStarters: home.starters,
      homeBench:    home.bench,
      awayStarters: away.starters,
      awayBench:    away.bench,
    }
  } catch (e) {
    console.warn('[espn] lineup error:', e.message)
    return null
  }
}
