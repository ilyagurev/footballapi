import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8').send(HTML)
})

const HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>vMix Bridge</title>
<style>
:root {
  --bg: #0d0d0d;
  --bg2: #161616;
  --bg3: #1e1e1e;
  --border: #2a2a2a;
  --text: #e8e8e8;
  --muted: #888;
  --live: #ef4444;
  --live-bg: #2a1111;
  --done: #555;
  --upcoming: #ca8a04;
  --upcoming-bg: #1f1700;
  --active-border: #3b82f6;
  --active-bg: #0d1f3c;
  --green: #22c55e;
  --mono: 'JetBrains Mono', monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); height: 100vh; display: flex; flex-direction: column; overflow: hidden; font-size: 14px; }

header { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--border); background: var(--bg2); flex-shrink: 0; }
.logo { font-size: 15px; font-weight: 600; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); }
.dot.err { background: var(--live); }
.hdr-info { font-size: 12px; color: var(--muted); }
.hdr-space { flex: 1; }
.logout-btn { font-size: 12px; padding: 4px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg3); color: var(--muted); cursor: pointer; white-space: nowrap; }
.logout-btn:hover { border-color: var(--live); color: var(--live); }
.role-tag { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
.role-tag.admin { background: #0e2a16; color: var(--green); }
.role-tag.viewer { background: var(--bg3); color: var(--muted); }

#auth-overlay {
  position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center;
  background: var(--bg);
}
.auth-box { display: flex; flex-direction: column; gap: 14px; width: 300px; padding: 28px; background: var(--bg2); border: 1px solid var(--border); border-radius: 14px; }
.auth-title { font-size: 18px; font-weight: 700; text-align: center; }
.auth-sub { font-size: 13px; color: var(--muted); text-align: center; margin-top: -8px; }
.auth-box input { background: var(--bg3); border: 1px solid var(--border); color: var(--text); padding: 10px 12px; border-radius: 8px; font-size: 14px; outline: none; }
.auth-box input:focus { border-color: var(--active-border); }
.auth-box button { background: var(--active-border); border: none; color: #fff; padding: 10px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.auth-box button:hover { filter: brightness(1.1); }
.auth-err { font-size: 12px; color: var(--live); text-align: center; min-height: 16px; }

.layout { display: flex; flex: 1; overflow: hidden; }

.left { flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--border); overflow: hidden; }
.filters { display: flex; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--border); background: var(--bg2); flex-shrink: 0; }
select, input[type=text] {
  background: var(--bg3); border: 1px solid var(--border); color: var(--text);
  padding: 5px 8px; border-radius: 6px; font-size: 13px; outline: none;
}
select:focus, input[type=text]:focus { border-color: var(--active-border); }
input[type=text] { flex: 1; }

.match-list { overflow-y: auto; flex: 1; }
.group-label {
  font-size: 11px; font-weight: 600; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase;
  padding: 6px 12px 4px; background: var(--bg); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 1;
}
.match-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px;
  border-bottom: 1px solid var(--border); cursor: pointer;
  transition: background 0.1s; border-left: 3px solid transparent;
}
.match-row:hover { background: var(--bg3); }
.match-row.is-preview { background: var(--active-bg); }
.match-row.is-vmix { border-left-color: var(--green); }
.match-time { font-size: 11px; color: var(--muted); min-width: 52px; }
.match-teams { flex: 1; display: flex; align-items: center; gap: 6px; min-width: 0; }
.flag-img { width: 22px; height: 15px; object-fit: cover; border-radius: 2px; border: 1px solid var(--border); }
.team-name { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vs { font-size: 11px; color: var(--muted); flex-shrink: 0; }
.match-score { font-size: 13px; font-weight: 600; min-width: 38px; text-align: center; font-family: var(--mono); }
.badge {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; min-width: 48px; text-align: center;
}
.badge-live { background: var(--live-bg); color: var(--live); }
.badge-ht { background: var(--live-bg); color: var(--live); }
.badge-ft { background: var(--bg3); color: var(--done); }
.badge-ns { background: var(--upcoming-bg); color: var(--upcoming); }
.sel-btn {
  font-size: 12px; padding: 3px 10px; border-radius: 5px; border: 1px solid var(--border);
  color: var(--muted); background: transparent; cursor: pointer; transition: all 0.1s; white-space: nowrap;
}
.sel-btn:hover { border-color: var(--active-border); color: var(--text); }
.sel-btn.vmix { background: var(--green); border-color: var(--green); color: #fff; cursor: default; }

.view-banner { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; border-radius: 8px 8px 0 0; font-size: 11px; font-weight: 600; }
.view-banner.on-air { background: #0e2a16; color: var(--green); border: 1px solid var(--green); border-bottom: none; }
.view-banner.preview { background: var(--bg3); color: var(--muted); border: 1px solid var(--border); border-bottom: none; }
.send-air-btn { font-size: 11px; padding: 3px 10px; border-radius: 5px; border: 1px solid var(--green); background: transparent; color: var(--green); cursor: pointer; white-space: nowrap; }
.send-air-btn:hover { background: var(--green); color: #fff; }
.active-card.framed { border-radius: 0 0 10px 10px; border-top: none; }

.right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; overflow-y: auto; padding: 14px 12px; gap: 16px; background: var(--bg2); }
.panel-title { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }

.active-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 14px; }
.active-teams { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.active-team { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; }
.active-flag { width: 44px; height: 29px; object-fit: cover; border-radius: 3px; border: 1px solid var(--border); }
.active-name { font-size: 11px; color: var(--muted); text-align: center; }
.active-score { font-size: 28px; font-weight: 700; font-family: var(--mono); padding: 0 10px; }
.active-meta { display: flex; justify-content: space-between; font-size: 12px; }
.active-group { color: var(--muted); }
.active-min { color: var(--live); font-weight: 600; }
.no-match { color: var(--muted); font-size: 12px; text-align: center; padding: 16px 0; }

.lineup-tabs { display: flex; gap: 6px; margin-bottom: 8px; }
.tab-btn {
  flex: 1; font-size: 12px; padding: 5px; border-radius: 6px;
  border: 1px solid var(--border); color: var(--muted); background: transparent; cursor: pointer;
}
.tab-btn.on { background: var(--bg3); color: var(--text); border-color: #444; }
.lineup-list { display: flex; flex-direction: column; gap: 2px; }
.pos-group { font-size: 10px; font-weight: 700; color: var(--muted); letter-spacing: 0.08em; margin: 6px 0 3px; }
.player-row { display: flex; align-items: center; gap: 6px; padding: 3px 6px; border-radius: 5px; }
.player-row:hover { background: var(--bg3); }
.player-num { font-family: var(--mono); font-size: 11px; color: var(--muted); min-width: 20px; text-align: right; }
.player-name { font-size: 12px; }
.no-lineup { color: var(--muted); font-size: 12px; padding: 8px 0; }

.endpoints { display: flex; flex-direction: column; gap: 5px; }
.ep {
  display: flex; align-items: center; gap: 7px; padding: 7px 9px;
  background: var(--bg3); border-radius: 7px; border: 1px solid var(--border);
}
.ep-method { font-family: var(--mono); font-size: 10px; color: var(--green); font-weight: 700; min-width: 28px; }
.ep-path { font-family: var(--mono); font-size: 11px; color: var(--muted); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ep-copy { font-size: 11px; color: var(--muted); cursor: pointer; flex-shrink: 0; padding: 0 2px; }
.ep-copy:hover { color: var(--text); }
.copy-ok { color: var(--green) !important; }

#hdr-match { display: flex; align-items: center; gap: 8px; font-size: 12px; }
#hdr-match:not(:empty) { padding: 4px 12px; background: var(--active-bg); border: 1px solid var(--active-border); border-radius: 8px; }
.hdr-match-score { font-family: var(--mono); font-weight: 700; color: var(--text); }
.hdr-match-live { color: var(--live); font-weight: 700; font-size: 11px; }
.hdr-match-ft { color: var(--done); font-size: 11px; }
</style>
</head>
<body>
<div id="auth-overlay">
  <form class="auth-box" onsubmit="return doLogin(event)">
    <div class="auth-title">⚽ vMix Bridge</div>
    <div class="auth-sub">Введите пароль для доступа</div>
    <input type="password" id="auth-pass" placeholder="Пароль" autocomplete="current-password" autofocus>
    <button type="submit">Войти</button>
    <div class="auth-err" id="auth-err"></div>
  </form>
</div>
<header>
  <span class="logo">⚽ vMix Bridge</span>
  <span class="dot" id="dot"></span>
  <span class="hdr-info" id="hdr-info">загрузка...</span>
  <span class="hdr-space"></span>
  <div id="hdr-match"></div>
  <span class="hdr-space"></span>
  <span class="hdr-info">опрос каждые 10 сек</span>
  <span class="role-tag" id="role-tag" style="display:none"></span>
  <button class="logout-btn" id="logout-btn" onclick="logout()" style="display:none">Выход</button>
</header>

<div class="layout">
  <div class="left">
    <div class="filters">
      <select id="f-status" onchange="applyFilters()">
        <option value="all">Все матчи</option>
        <option value="live">Live</option>
        <option value="today">Сегодня</option>
        <option value="upcoming">Предстоящие</option>
        <option value="finished">Завершённые</option>
      </select>
      <select id="f-group" onchange="applyFilters()">
        <option value="all">Все группы</option>
      </select>
      <select id="f-sort" onchange="applyFilters()">
        <option value="time">По времени</option>
        <option value="group">По группе</option>
        <option value="status">По статусу</option>
        <option value="team">По команде</option>
      </select>
      <input type="text" id="f-search" placeholder="Поиск команды…" oninput="applyFilters()">
    </div>
    <div class="match-list" id="match-list">
      <div style="padding:20px;color:var(--muted)">Загрузка...</div>
    </div>
  </div>

  <div class="right">
    <div>
      <div class="panel-title" id="match-panel-title">Активный матч</div>
      <div id="active-card"></div>
    </div>
    <div>
      <div class="panel-title">Состав</div>
      <div class="lineup-tabs">
        <button class="tab-btn on" id="tab-home" onclick="setTab('home')">Хозяева</button>
        <button class="tab-btn" id="tab-away" onclick="setTab('away')">Гости</button>
      </div>
      <div class="lineup-list" id="lineup"></div>
    </div>
    <div>
      <div class="panel-title">DataSource URL для vMix</div>
      <div class="endpoints" id="endpoints"></div>
    </div>
  </div>
</div>

<script>
let S = null;
let lineupTab = 'home';
let previewId = null;      // match clicked for viewing (client-only, NOT sent to vMix)
let previewData = null;    // { match, homeLineup, awayLineup } when previewing a non-active match
let ROLE = null;          // 'admin' | 'viewer' — set after login
let polling = false;

function canAir() { return ROLE === 'admin'; }

function activeId() { return S && S.activeMatchId; }

// What the right panel (card + lineups) should display
function viewModel() {
  if (previewId && previewId !== activeId() && previewData && previewData.match) {
    // re-resolve match from fresh poll data so score/status stay current; keep fetched lineups
    const fresh = (S && S.allMatches && S.allMatches.find(function(x){ return x.id === previewId; })) || previewData.match;
    return { match: fresh, home: previewData.homeLineup || [], away: previewData.awayLineup || [], isVmix: false };
  }
  return { match: (S && S.match) || null, home: (S && S.homeLineup) || [], away: (S && S.awayLineup) || [], isVmix: !!(S && S.match) };
}

async function previewMatch(id) {
  previewId = id;
  if (id === activeId()) { previewData = null; render(); return; }
  const m = S && S.allMatches && S.allMatches.find(function(x){ return x.id === id; });
  previewData = { match: m, homeLineup: [], awayLineup: [] };  // show card instantly, lineups fill after fetch
  render();
  try {
    const res = await fetch('/api/preview/' + id);
    const data = await res.json();
    if (previewId === id) { previewData = data; render(); }
  } catch (e) {}
}

function handleRowClick(el) { previewMatch(el.dataset.mid); }

const POS_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Attacker'];
const POS_LABEL = { Goalkeeper: 'GK', Defender: 'DEF', Midfielder: 'MID', Forward: 'FWD', Attacker: 'FWD' };

async function init() {
  try {
    const res = await fetch('/api/me');
    if (res.ok) {
      const d = await res.json();
      ROLE = d.role;
      showApp();
    } else {
      showAuth();
    }
  } catch (e) {
    showAuth();
  }
}

function showAuth() {
  ROLE = null;
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('logout-btn').style.display = 'none';
  document.getElementById('role-tag').style.display = 'none';
  const p = document.getElementById('auth-pass');
  if (p) { p.value = ''; p.focus(); }
}

function showApp() {
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('logout-btn').style.display = '';
  const tag = document.getElementById('role-tag');
  tag.style.display = '';
  tag.className = 'role-tag ' + (ROLE === 'admin' ? 'admin' : 'viewer');
  tag.textContent = ROLE === 'admin' ? 'эфир + просмотр' : 'только просмотр';
  fetchState();
  if (!polling) {
    polling = true;
    setInterval(fetchState, 10_000);
    setInterval(renderHeader, 5_000);
  }
}

async function doLogin(ev) {
  ev.preventDefault();
  const pass = document.getElementById('auth-pass').value;
  const errEl = document.getElementById('auth-err');
  errEl.textContent = '';
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass }),
    });
    if (res.ok) {
      const d = await res.json();
      ROLE = d.role;
      showApp();
    } else {
      errEl.textContent = 'Неверный пароль';
    }
  } catch (e) {
    errEl.textContent = 'Ошибка соединения';
  }
  return false;
}

async function logout() {
  try { await fetch('/api/logout', { method: 'POST' }); } catch (e) {}
  location.reload();
}

async function fetchState() {
  try {
    const res = await fetch('/api/status');
    if (res.status === 401) { showAuth(); return; }
    S = await res.json();
    render();
  } catch (e) {
    document.getElementById('hdr-info').textContent = 'Ошибка соединения';
  }
}

function render() {
  renderHeader();
  renderHeaderMatch();
  renderMatchList();
  renderActiveCard();
  renderLineup();
  renderEndpoints();
  populateGroupFilter();
}

function renderHeaderMatch() {
  const el = document.getElementById('hdr-match');
  if (!S || !S.match) { el.innerHTML = ''; return; }
  const m = S.match;
  const score = esc(String(m.home_score ?? 0)) + ' – ' + esc(String(m.away_score ?? 0));
  const e = m.time_elapsed || 'notstarted';
  const isLive = e === 'firsthalf' || e === 'secondhalf' || e === 'halftime';
  const isFT = e === 'finished';
  const min = isLive && S.minute ? S.minute + "'" : null;
  const statusLabel = min || (e === 'firsthalf' ? '1T' : e === 'secondhalf' ? '2T' : e === 'halftime' ? 'HT' : '');
  el.innerHTML =
    '<span style="color:var(--muted)">' + esc(m.home_team_name_en) + '</span>' +
    '<span class="hdr-match-score">' + score + '</span>' +
    '<span style="color:var(--muted)">' + esc(m.away_team_name_en) + '</span>' +
    (isLive && statusLabel ? '<span class="hdr-match-live">' + statusLabel + '</span>' : '') +
    (isFT ? '<span class="hdr-match-ft">FT</span>' : '');
}

function renderHeader() {
  const dot = document.getElementById('dot');
  const info = document.getElementById('hdr-info');
  if (!S) return;
  if (S.lastError) {
    dot.className = 'dot err';
    info.textContent = 'Ошибка: ' + S.lastError;
  } else if (S.lastUpdated) {
    dot.className = 'dot';
    const d = new Date(S.lastUpdated);
    const sec = Math.round((Date.now() - d) / 1000);
    info.textContent = sec < 5 ? 'только что' : sec + ' сек назад';
  }
  renderHeaderMatch();
}

function populateGroupFilter() {
  const sel = document.getElementById('f-group');
  const current = sel.value;
  const groups = [...new Set((S.allMatches || []).map(m => m.group).filter(Boolean))];
  groups.sort();
  sel.innerHTML = '<option value="all">Все группы</option>' +
    groups.map(g => '<option value="' + g + '"' + (g === current ? ' selected' : '') + '>' + g + '</option>').join('');
}

function applyFilters() { renderMatchList(); }

function getFilters() {
  return {
    status: document.getElementById('f-status').value,
    group: document.getElementById('f-group').value,
    sort: document.getElementById('f-sort').value,
    search: document.getElementById('f-search').value.toLowerCase().trim(),
  };
}

const GROUP_ORDER = ['A','B','C','D','E','F','G','H','I','J','K','L','R32','R16','QF','SF','3RD','FINAL'];
const STATUS_RANK = { firsthalf: 0, secondhalf: 0, halftime: 0, notstarted: 1, finished: 2 };

function sortMatches(matches, sort) {
  const copy = [...matches];
  if (sort === 'time') {
    copy.sort((a, b) => (parseDate(a.local_date, a.venue_utc_offset) || 0) - (parseDate(b.local_date, b.venue_utc_offset) || 0));
  } else if (sort === 'group') {
    copy.sort((a, b) => {
      const ga = GROUP_ORDER.indexOf(a.group), gb = GROUP_ORDER.indexOf(b.group);
      return (ga === -1 ? 99 : ga) - (gb === -1 ? 99 : gb) ||
             (parseDate(a.local_date, a.venue_utc_offset) || 0) - (parseDate(b.local_date, b.venue_utc_offset) || 0);
    });
  } else if (sort === 'status') {
    copy.sort((a, b) => {
      const ra = STATUS_RANK[a.time_elapsed || 'notstarted'] ?? 1;
      const rb = STATUS_RANK[b.time_elapsed || 'notstarted'] ?? 1;
      return ra - rb || (parseDate(a.local_date, a.venue_utc_offset) || 0) - (parseDate(b.local_date, b.venue_utc_offset) || 0);
    });
  } else if (sort === 'team') {
    copy.sort((a, b) => (a.home_team_name_en || '').localeCompare(b.home_team_name_en || ''));
  }
  return copy;
}

function groupMatches(matches, sort) {
  const groups = {};
  for (const m of matches) {
    let key;
    if (sort === 'group') {
      key = 'Группа ' + (m.group || '—');
    } else if (sort === 'status') {
      const e = m.time_elapsed || 'notstarted';
      key = (e === 'firsthalf' || e === 'secondhalf' || e === 'halftime') ? '🔴 Live'
          : e === 'finished' ? '✓ Завершённые'
          : '⏳ Предстоящие';
    } else if (sort === 'team') {
      key = (m.home_team_name_en || '—')[0].toUpperCase();
    } else {
      const dt = parseDate(m.local_date, m.venue_utc_offset);
      key = dt ? dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Asia/Dubai' }) : '—';
    }
    (groups[key] = groups[key] || []).push(m);
  }
  return groups;
}

function filterMatches(matches) {
  const { status, group, search } = getFilters();
  const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Dubai' });

  return matches.filter(m => {
    const elapsed = m.time_elapsed || 'notstarted';
    const isLive = elapsed === 'firsthalf' || elapsed === 'secondhalf';
    const isHT = elapsed === 'halftime';
    const isFT = elapsed === 'finished';
    const dt = parseDate(m.local_date, m.venue_utc_offset);
    const isToday = dt && dt.toLocaleDateString('en-US', { timeZone: 'Asia/Dubai' }) === todayStr;

    if (status === 'live' && !isLive && !isHT) return false;
    if (status === 'today' && !isToday) return false;
    if (status === 'upcoming' && (isLive || isHT || isFT)) return false;
    if (status === 'finished' && !isFT) return false;
    if (group !== 'all' && m.group !== group) return false;
    if (search) {
      const home = (m.home_team_name_en || '').toLowerCase();
      const away = (m.away_team_name_en || '').toLowerCase();
      if (!home.includes(search) && !away.includes(search)) return false;
    }
    return true;
  });
}

// local_date from worldcup26.ir is the venue's LOCAL time (not UTC).
// utcOffset: -4 Eastern, -5 Central, -7 Western (summer DST, WC period)
function parseDate(localDate, utcOffset) {
  if (!localDate) return null;
  try {
    const parts = localDate.split(' ');
    if (parts.length < 2) return null;
    const dp = parts[0].split('/');
    const hhmm = parts[1];
    if (dp.length < 3) return null;
    const [mm, dd, yyyy] = dp;
    if (utcOffset == null) {
      return new Date(yyyy + '-' + mm + '-' + dd + 'T' + hhmm + ':00Z');
    }
    const sign = utcOffset >= 0 ? '+' : '-';
    const abs = Math.abs(utcOffset);
    const ohh = String(Math.floor(abs)).padStart(2, '0');
    const omm = String(Math.round((abs % 1) * 60)).padStart(2, '0');
    return new Date(yyyy + '-' + mm + '-' + dd + 'T' + hhmm + ':00' + sign + ohh + ':' + omm);
  } catch {
    return null;
  }
}

function renderMatchList() {
  if (!S?.allMatches?.length) {
    document.getElementById('match-list').innerHTML = '<div style="padding:20px;color:var(--muted)">Нет данных</div>';
    return;
  }

  const { sort } = getFilters();
  const matches = sortMatches(filterMatches(S.allMatches), sort);
  if (!matches.length) {
    document.getElementById('match-list').innerHTML = '<div style="padding:20px;color:var(--muted)">Нет матчей</div>';
    return;
  }

  const grouped = groupMatches(matches, sort);
  let html = '';
  for (const [label, ms] of Object.entries(grouped)) {
    const extra = sort === 'time' ? ' &nbsp;·&nbsp; Группа ' + esc(ms[0]?.group || '') : '';
    html += '<div class="group-label">' + esc(label) + extra + '</div>';
    for (const m of ms) html += matchRow(m);
  }

  document.getElementById('match-list').innerHTML = html;
}

function matchRow(m) {
  const isVmix = S.activeMatchId === m.id;
  const viewedId = previewId || S.activeMatchId;
  const isPreview = viewedId === m.id;
  const dt = parseDate(m.local_date, m.venue_utc_offset);
  const time = dt ? dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }) : '';
  const score = (m.finished === 'TRUE' || m.time_elapsed !== 'notstarted')
    ? esc(m.home_score) + ' – ' + esc(m.away_score)
    : '– : –';
  const badge = statusBadge(m);
  const homeFlag = '/flags/' + esc(m.home_team_id) + '.jpg';
  const awayFlag = '/flags/' + esc(m.away_team_id) + '.jpg';
  const cls = 'match-row' + (isPreview ? ' is-preview' : '') + (isVmix ? ' is-vmix' : '');

  let airBtn = '';
  if (isVmix) {
    airBtn = '<button class="sel-btn vmix" disabled>● эфир</button>';
  } else if (canAir()) {
    airBtn = '<button class="sel-btn" data-mid="' + esc(m.id) + '" onclick="event.stopPropagation(); handleSelect(this)">в эфир</button>';
  }

  return \`<div class="\${cls}" data-mid="\${m.id}" onclick="handleRowClick(this)">
    <div class="match-time">\${time}</div>
    <div class="match-teams">
      <img class="flag-img" src="\${homeFlag}" onerror="this.style.display='none'" alt="">
      <span class="team-name">\${esc(m.home_team_name_en)}</span>
      <span class="vs">vs</span>
      <span class="team-name">\${esc(m.away_team_name_en)}</span>
      <img class="flag-img" src="\${awayFlag}" onerror="this.style.display='none'" alt="">
    </div>
    <div class="match-score">\${score}</div>
    \${badge}
    \${airBtn}
  </div>\`;
}

function statusBadge(m) {
  const e = m.time_elapsed || 'notstarted';
  const isActive = S.activeMatchId === m.id;
  const min = isActive && S.minute ? S.minute + "'" : null;

  if (e === 'firsthalf' || e === 'secondhalf') {
    return '<span class="badge badge-live">' + (min || (e === 'firsthalf' ? '1T' : '2T')) + '</span>';
  }
  if (e === 'halftime') return '<span class="badge badge-ht">HT</span>';
  if (e === 'finished') return '<span class="badge badge-ft">FT</span>';

  const dt = parseDate(m.local_date, m.venue_utc_offset);
  const label = dt ? dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }) : '—';
  return '<span class="badge badge-ns">' + label + '</span>';
}

function renderActiveCard() {
  const el = document.getElementById('active-card');
  const titleEl = document.getElementById('match-panel-title');
  const vm = viewModel();
  const m = vm.match;

  if (!m) {
    titleEl.textContent = 'Матч';
    el.innerHTML = '<div class="no-match">Кликните строку для просмотра,<br>кнопка «в эфир» отправит матч в vMix.</div>';
    return;
  }

  const homeFlag = '/flags/' + esc(m.home_team_id) + '.jpg';
  const awayFlag = '/flags/' + esc(m.away_team_id) + '.jpg';
  const minLabel = (vm.isVmix && S.minute != null) ? S.minute + "' " : '';
  const statusLabel = { firsthalf: '1-й тайм', secondhalf: '2-й тайм', halftime: 'Перерыв', finished: 'Завершён', notstarted: 'Не начат' }[m.time_elapsed] || m.time_elapsed || '';
  const dt = parseDate(m.local_date, m.venue_utc_offset);
  const kickoff = dt ? dt.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }) : '';
  const rightMeta = (m.time_elapsed === 'notstarted' || !m.time_elapsed)
    ? '🕐 ' + esc(kickoff)
    : minLabel + statusLabel;

  let banner;
  if (vm.isVmix) {
    titleEl.textContent = 'Активный матч';
    banner = '<div class="view-banner on-air"><span>● В ЭФИРЕ (vMix)</span></div>';
  } else {
    titleEl.textContent = 'Просмотр';
    const airBtn = canAir()
      ? '<button class="send-air-btn" data-mid="' + esc(m.id) + '" onclick="handleSelect(this)">▶ В эфир</button>'
      : '';
    banner = '<div class="view-banner preview"><span>Просмотр — не в эфире</span>' + airBtn + '</div>';
  }

  el.innerHTML = banner + \`<div class="active-card framed">
    <div class="active-teams">
      <div class="active-team">
        <img class="active-flag" src="\${homeFlag}" onerror="this.style.display='none'" alt="">
        <div class="active-name">\${esc(m.home_team_name_en)}</div>
      </div>
      <div class="active-score">\${esc(String(m.home_score ?? 0))} – \${esc(String(m.away_score ?? 0))}</div>
      <div class="active-team">
        <img class="active-flag" src="\${awayFlag}" onerror="this.style.display='none'" alt="">
        <div class="active-name">\${esc(m.away_team_name_en)}</div>
      </div>
    </div>
    <div class="active-meta">
      <span class="active-group">Группа \${esc(m.group || '')}</span>
      <span class="active-min">\${rightMeta}</span>
    </div>
  </div>\`;
}

function setTab(tab) {
  lineupTab = tab;
  document.getElementById('tab-home').className = 'tab-btn' + (tab === 'home' ? ' on' : '');
  document.getElementById('tab-away').className = 'tab-btn' + (tab === 'away' ? ' on' : '');
  renderLineup();
}

function renderLineup() {
  const el = document.getElementById('lineup');
  const vm = viewModel();
  const players = lineupTab === 'home' ? vm.home : vm.away;

  if (!players.length) {
    el.innerHTML = '<div class="no-lineup">Нет данных</div>';
    return;
  }

  const groups = {};
  for (const p of players) {
    const pos = p.Position || 'Other';
    (groups[pos] = groups[pos] || []).push(p);
  }

  const order = [...POS_ORDER, ...Object.keys(groups).filter(k => !POS_ORDER.includes(k))];
  let html = '';
  for (const pos of order) {
    if (!groups[pos]) continue;
    html += '<div class="pos-group">' + (POS_LABEL[pos] || pos) + '</div>';
    for (const p of groups[pos]) {
      html += \`<div class="player-row"><span class="player-num">\${esc(p.Number)}</span><span class="player-name">\${esc(p.Name)}</span></div>\`;
    }
  }
  el.innerHTML = html;
}

function renderEndpoints() {
  const host = window.location.origin;
  const eps = [
    { method: 'JSON', path: '/vmix/score.json' },
    { method: 'JSON', path: '/vmix/lineup/home.json' },
    { method: 'JSON', path: '/vmix/lineup/away.json' },
    { method: 'IMG',  path: '/flags/{teamId}.jpg' },
  ];
  document.getElementById('endpoints').innerHTML = eps.map(e => \`
    <div class="ep">
      <span class="ep-method">\${e.method}</span>
      <span class="ep-path">\${esc(host + e.path)}</span>
      <span class="ep-copy" onclick="copyEp(this, '\${esc(host + e.path)}')">⎘</span>
    </div>\`).join('');
}

function copyEp(el, text) {
  navigator.clipboard.writeText(text).then(() => {
    el.classList.add('copy-ok');
    el.textContent = '✓';
    setTimeout(() => { el.classList.remove('copy-ok'); el.textContent = '⎘'; }, 1500);
  });
}

function handleSelect(btn) {
  selectMatch(btn.dataset.mid);
}

async function selectMatch(id) {
  const match = S && S.allMatches && S.allMatches.find(function(m) { return m.id === id; });
  const label = match ? match.home_team_name_en + ' vs ' + match.away_team_name_en : 'этот матч';
  if (!confirm('Отправить в эфир (vMix):\\n' + label + '?')) return;
  await fetch('/api/select/' + id, { method: 'POST' });
  previewId = null;
  previewData = null;
  await fetchState();
}

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

init();
</script>
</body>
</html>`

export default router
