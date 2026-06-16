export const state = {
  activeMatchId: null,
  match: null,
  minute: null,
  period: null,   // 1 = first half, 2 = second half (from ESPN)
  allMatches: [],
  teamsMap: {},
  stadiumsMap: {},
  homeLineup: [],
  awayLineup: [],
  lineupsForMatchId: null,
  squadsCache: {},
  lastUpdated: null,
  lastError: null,
  // Broadcast-delay sync: vMix gets score/minute as they were `vmixDelaySec` ago.
  vmixDelaySec: 0,                 // 0..60
  scoreHistory: [],                // [{ t, matchId, home_score, away_score, minute, time_elapsed }]
  matchSource: 'worldcup',         // 'worldcup' | 'football-data'
}
