import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8').send(HTML)
})

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Artes FIFA</title>
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
.poll { display: inline-flex; align-items: center; gap: 7px; }
.poll-ring { width: 24px; height: 24px; transform: rotate(-90deg); }
.poll-ring circle { fill: none; stroke-width: 3.5; }
.poll-bg { stroke: var(--border); }
.poll-fg { stroke: var(--green); stroke-linecap: round; stroke-dasharray: 94.25; stroke-dashoffset: 0; }
.poll-num { font-family: var(--mono); font-size: 12px; color: var(--muted); min-width: 26px; text-align: right; }
.poll.updating .poll-ring { animation: pollSpin 0.6s ease; }
.poll.updating .poll-fg { stroke: var(--text); }
.poll.updating .poll-num { color: var(--green); }
@keyframes pollSpin { from { transform: rotate(-90deg); } to { transform: rotate(270deg); } }

.delay-ctl { display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border: 1px solid var(--border); border-radius: 6px; }
.delay-label { font-size: 11px; color: var(--muted); white-space: nowrap; }
.delay-val { font-family: var(--mono); font-size: 12px; font-weight: 700; min-width: 30px; text-align: center; color: var(--text); }
.delay-btn { font-size: 12px; line-height: 1; width: 22px; height: 22px; padding: 0; border: 1px solid var(--border); border-radius: 4px; background: var(--bg3); color: var(--text); cursor: pointer; }
.delay-btn:hover { border-color: var(--active-border); color: var(--active-border); }
.delay-btn:active { background: var(--active-border); color: #fff; }

.lang-switch { display: inline-flex; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
.lang-switch button { font-family: inherit; font-size: 11px; font-weight: 700; padding: 4px 9px; background: var(--bg3); color: var(--muted); border: none; cursor: pointer; }
.lang-switch button.on { background: var(--active-border); color: #fff; }
.lang-switch button:not(.on):hover { color: var(--text); }

.src-switch { display: inline-flex; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
.src-switch button { font-family: inherit; font-size: 11px; font-weight: 700; padding: 4px 9px; background: var(--bg3); color: var(--muted); border: none; cursor: pointer; }
.src-switch button.on { background: #0e2a16; color: var(--green); }
.src-switch button:not(.on):hover { color: var(--text); }

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

.right { width: 460px; flex-shrink: 0; display: flex; flex-direction: column; overflow-y: auto; padding: 14px 16px; gap: 16px; background: var(--bg2); }
.panel-title { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }

.active-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 18px; }
.active-teams { display: flex; flex-wrap: nowrap; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.active-team { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.active-flag { width: 96px; height: 64px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border); }
.active-name { font-size: 13px; color: var(--muted); text-align: center; }
.active-score { font-size: 38px; font-weight: 700; font-family: var(--mono); padding: 0 14px; white-space: nowrap; flex-shrink: 0; }
.active-min-row { text-align: center; margin: -2px 0 10px; min-height: 22px; }
.amin-num { font-family: var(--mono); font-size: 20px; font-weight: 700; color: var(--live); }
.amin-sep { font-size: 14px; color: var(--muted); margin: 0 8px; }
.amin-lbl { font-size: 13px; font-weight: 600; color: var(--live); }
.active-meta { display: flex; justify-content: space-between; font-size: 12px; }
.active-group { color: var(--muted); }
.active-min { color: var(--muted); }
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

.endpoints { display: flex; flex-direction: column; gap: 7px; }
.ep {
  display: flex; align-items: center; gap: 9px; padding: 9px 11px;
  background: var(--bg3); border-radius: 8px; border: 1px solid var(--border);
}
.ep-method { font-family: var(--mono); font-size: 11px; color: var(--green); font-weight: 700; min-width: 32px; }
.ep-info { flex: 1; min-width: 0; overflow: hidden; }
.ep-desc { font-size: 12px; color: var(--text); margin-bottom: 2px; }
.ep-path { font-family: var(--mono); font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ep-copy {
  font-size: 12px; font-weight: 600; color: var(--text); cursor: pointer; flex-shrink: 0;
  padding: 6px 14px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg2);
  white-space: nowrap; transition: all 0.1s;
}
.ep-copy:hover { border-color: var(--active-border); color: var(--active-border); }
.ep-copy.copy-ok { color: var(--green); border-color: var(--green); }

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
    <div class="auth-title">⚽ Artes FIFA</div>
    <div class="auth-sub" data-i18n="auth_sub">Enter password to continue</div>
    <input type="password" id="auth-pass" placeholder="Password" data-i18n-ph="auth_pass_ph" autocomplete="current-password" autofocus>
    <button type="submit" data-i18n="auth_login">Sign in</button>
    <div class="auth-err" id="auth-err"></div>
  </form>
</div>
<header>
  <span class="logo">⚽ Artes FIFA</span>
  <span class="dot" id="dot"></span>
  <span class="hdr-info" id="hdr-info" data-i18n="hdr_loading">loading...</span>
  <span class="hdr-space"></span>
  <div id="hdr-match"></div>
  <span class="hdr-space"></span>
  <span class="poll" id="poll" data-i18n-title="poll_title" title="Auto-refresh every 10 seconds">
    <svg class="poll-ring" viewBox="0 0 36 36" aria-hidden="true">
      <circle class="poll-bg" cx="18" cy="18" r="15"></circle>
      <circle class="poll-fg" id="poll-arc" cx="18" cy="18" r="15"></circle>
    </svg>
    <span class="poll-num" id="poll-num">10s</span>
  </span>
  <span class="delay-ctl" id="delay-ctl" style="display:none" data-i18n-title="delay_title" title="Broadcast delay for vMix (0–60s)">
    <span class="delay-label" data-i18n="delay">Delay</span>
    <button class="delay-btn" onclick="changeDelay(-1)" aria-label="−1">▼</button>
    <span class="delay-val" id="delay-val">0s</span>
    <button class="delay-btn" onclick="changeDelay(1)" aria-label="+1">▲</button>
  </span>
  <span class="src-switch" id="src-switch" style="display:none">
    <button data-src="worldcup" onclick="setSource('worldcup')">WC26</button>
    <button data-src="football-data" onclick="setSource('football-data')">FD.org</button>
  </span>
  <span class="lang-switch">
    <button data-lang="en" onclick="setLang('en')">EN</button>
    <button data-lang="ru" onclick="setLang('ru')">RU</button>
  </span>
  <span class="role-tag" id="role-tag" style="display:none"></span>
  <button class="logout-btn" id="logout-btn" onclick="logout()" style="display:none" data-i18n="logout">Log out</button>
</header>

<div class="layout">
  <div class="left">
    <div class="filters">
      <select id="f-status" onchange="applyFilters()">
        <option value="all" data-i18n="f_status_all">All matches</option>
        <option value="live" data-i18n="f_status_live">Live</option>
        <option value="today" data-i18n="f_status_today">Today</option>
        <option value="upcoming" data-i18n="f_status_upcoming">Upcoming</option>
        <option value="finished" data-i18n="f_status_finished">Finished</option>
      </select>
      <select id="f-group" onchange="applyFilters()">
        <option value="all" data-i18n="f_group_all">All groups</option>
      </select>
      <select id="f-sort" onchange="applyFilters()">
        <option value="time" data-i18n="f_sort_time">By time</option>
        <option value="group" data-i18n="f_sort_group">By group</option>
        <option value="status" data-i18n="f_sort_status">By status</option>
        <option value="team" data-i18n="f_sort_team">By team</option>
      </select>
      <input type="text" id="f-search" placeholder="Search team…" data-i18n-ph="f_search_ph" oninput="applyFilters()">
    </div>
    <div class="match-list" id="match-list">
      <div style="padding:20px;color:var(--muted)" data-i18n="loading">Loading...</div>
    </div>
  </div>

  <div class="right">
    <div>
      <div class="panel-title" id="match-panel-title">Active match</div>
      <div id="active-card"></div>
    </div>
    <div>
      <div class="panel-title" data-i18n="lineup">Lineup</div>
      <div class="lineup-tabs">
        <button class="tab-btn on" id="tab-home" onclick="setTab('home')" data-i18n="tab_home">Home</button>
        <button class="tab-btn" id="tab-away" onclick="setTab('away')" data-i18n="tab_away">Away</button>
      </div>
      <div class="lineup-list" id="lineup"></div>
    </div>
    <div id="endpoints-block">
      <div class="panel-title" data-i18n="datasource">DataSource URL for vMix</div>
      <div class="endpoints" id="endpoints"></div>
    </div>
  </div>
</div>

<script>
const I18N = {
  en: {
    auth_sub: 'Enter password to continue', auth_pass_ph: 'Password', auth_login: 'Sign in',
    auth_err_wrong: 'Wrong password', auth_err_conn: 'Connection error',
    hdr_loading: 'loading...', poll_title: 'Auto-refresh every 10 seconds',
    role_admin: 'air + view', role_viewer: 'view only', logout: 'Log out',
    f_status_all: 'All matches', f_status_live: 'Live', f_status_today: 'Today',
    f_status_upcoming: 'Upcoming', f_status_finished: 'Finished', f_group_all: 'All groups',
    f_sort_time: 'By time', f_sort_group: 'By group', f_sort_status: 'By status', f_sort_team: 'By team',
    f_search_ph: 'Search team…', loading: 'Loading...', lineup: 'Lineup',
    tab_home: 'Home', tab_away: 'Away', datasource: 'DataSource URL for vMix',
    just_now: 'just now', sec_ago: 's ago', sec_short: 's', error_prefix: 'Error: ',
    delay: 'Delay', delay_title: 'Broadcast delay for vMix output (0–60s)',
    no_data: 'No data', no_matches: 'No matches', no_lineup: 'No data',
    starting_xi: 'Starting XI', bench: 'Bench',
    group_word: 'Group', grp_live: '🔴 Live', grp_finished: '✓ Finished', grp_upcoming: '⏳ Upcoming',
    badge_h1: '1H', badge_h2: '2H', air_on: '● on air', air_send: 'Go live',
    panel_match: 'Match', panel_active: 'Active match', panel_preview: 'Preview',
    card_hint: 'Click a row to preview;<br>the «Go live» button sends it to vMix.',
    st_firsthalf: '1st half', st_secondhalf: '2nd half', st_halftime: 'Half-time',
    st_live: 'Live', st_finished: 'Finished', st_notstarted: 'Not started',
    banner_onair: '● ON AIR (vMix)', banner_preview: 'Preview — not on air',
    copy: 'Copy', copied: '✓ Copied', copy_manual: 'Select manually',
    confirm_air_pre: 'Send to vMix (on air):\\n', confirm_air_post: '?', this_match: 'this match',
    ep_score: 'Score, teams, flags, minute',
    ep_home_full: 'Home — full roster',
    ep_home_start: 'Home — Starting XI',
    ep_home_bench: 'Home — Bench',
    ep_away_full: 'Away — full roster',
    ep_away_start: 'Away — Starting XI',
    ep_away_bench: 'Away — Bench',
    ep_flag: 'Team flag by TLA code',
  },
  ru: {
    auth_sub: 'Введите пароль для доступа', auth_pass_ph: 'Пароль', auth_login: 'Войти',
    auth_err_wrong: 'Неверный пароль', auth_err_conn: 'Ошибка соединения',
    hdr_loading: 'загрузка...', poll_title: 'Автообновление каждые 10 секунд',
    role_admin: 'эфир + просмотр', role_viewer: 'только просмотр', logout: 'Выход',
    f_status_all: 'Все матчи', f_status_live: 'Live', f_status_today: 'Сегодня',
    f_status_upcoming: 'Предстоящие', f_status_finished: 'Завершённые', f_group_all: 'Все группы',
    f_sort_time: 'По времени', f_sort_group: 'По группе', f_sort_status: 'По статусу', f_sort_team: 'По команде',
    f_search_ph: 'Поиск команды…', loading: 'Загрузка...', lineup: 'Состав',
    tab_home: 'Хозяева', tab_away: 'Гости', datasource: 'DataSource URL для vMix',
    just_now: 'только что', sec_ago: ' сек назад', sec_short: 'с', error_prefix: 'Ошибка: ',
    delay: 'Задержка', delay_title: 'Задержка передачи в vMix (0–60с)',
    no_data: 'Нет данных', no_matches: 'Нет матчей', no_lineup: 'Нет данных',
    starting_xi: 'Основной состав', bench: 'Запасные',
    group_word: 'Группа', grp_live: '🔴 Live', grp_finished: '✓ Завершённые', grp_upcoming: '⏳ Предстоящие',
    badge_h1: '1Т', badge_h2: '2Т', air_on: '● эфир', air_send: 'В эфир',
    panel_match: 'Матч', panel_active: 'Активный матч', panel_preview: 'Просмотр',
    card_hint: 'Кликните строку для просмотра,<br>кнопка «В эфир» отправит матч в vMix.',
    st_firsthalf: '1-й тайм', st_secondhalf: '2-й тайм', st_halftime: 'Перерыв',
    st_live: 'Live', st_finished: 'Завершён', st_notstarted: 'Не начат',
    banner_onair: '● В ЭФИРЕ (vMix)', banner_preview: 'Просмотр — не в эфире',
    copy: 'Копировать', copied: '✓ Скопировано', copy_manual: 'Выделите вручную',
    confirm_air_pre: 'Отправить в эфир (vMix):\\n', confirm_air_post: '?', this_match: 'этот матч',
    ep_score: 'Счёт, команды, флаги, минута',
    ep_home_full: 'Хозяева — полный состав',
    ep_home_start: 'Хозяева — Основной состав',
    ep_home_bench: 'Хозяева — Запасные',
    ep_away_full: 'Гости — полный состав',
    ep_away_start: 'Гости — Основной состав',
    ep_away_bench: 'Гости — Запасные',
    ep_flag: 'Флаг команды по коду TLA',
  },
};

function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}
function setCookie(name, val, days) {
  document.cookie = name + '=' + encodeURIComponent(val) + '; Path=/; Max-Age=' + (days * 86400) + '; SameSite=Lax';
}

let LANG = (getCookie('lang') === 'ru') ? 'ru' : 'en';   // default English
function t(key) { return (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key; }
function dateLocale() { return LANG === 'ru' ? 'ru-RU' : 'en-GB'; }

function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) { el.textContent = t(el.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
  document.querySelectorAll('[data-i18n-title]').forEach(function(el) { el.title = t(el.getAttribute('data-i18n-title')); });
  document.documentElement.lang = LANG;
  updateLangSwitch();
  updateRoleTag();
}
function updateLangSwitch() {
  document.querySelectorAll('.lang-switch button').forEach(function(b) {
    b.classList.toggle('on', b.getAttribute('data-lang') === LANG);
  });
}
function updateRoleTag() {
  const tag = document.getElementById('role-tag');
  if (!tag || !ROLE) return;
  tag.textContent = ROLE === 'admin' ? t('role_admin') : t('role_viewer');
}
function setLang(lang) {
  if (lang !== 'ru' && lang !== 'en') return;
  LANG = lang;
  setCookie('lang', lang, 365);
  applyStaticI18n();
  if (S) render();
  renderHeader();
}

let S = null;
let lineupTab = 'home';
let previewId = null;      // match clicked for viewing (client-only, NOT sent to vMix)
let previewData = null;    // { match, homeLineup, awayLineup } when previewing a non-active match
let ROLE = null;          // 'admin' | 'viewer' — set after login
let polling = false;
let delaySec = 0;         // broadcast delay for vMix output (0..60), admin-controlled
let delayDirtyUntil = 0;  // ignore server delay sync briefly after a local change
let matchSource = 'worldcup';  // 'worldcup' | 'football-data'

const POLL_MS = 10_000;
const POLL_CIRC = 2 * Math.PI * 15;  // ring circumference (r=15), matches CSS dasharray
let nextPollAt = 0;

function canAir() { return ROLE === 'admin'; }

// Smoothly update the countdown ring + number toward the next poll
function tickPoll() {
  const arc = document.getElementById('poll-arc');
  const num = document.getElementById('poll-num');
  if (!arc || !num) return;
  const remainMs = Math.max(0, nextPollAt - Date.now());
  const frac = remainMs / POLL_MS;                 // 1 → 0
  arc.style.strokeDashoffset = String(POLL_CIRC * (1 - frac));  // full → empty
  num.textContent = Math.ceil(remainMs / 1000) + t('sec_short');
}

// Brief flash/spin when fresh data arrives
function flashPoll() {
  const el = document.getElementById('poll');
  if (!el) return;
  el.classList.remove('updating');
  void el.offsetWidth;  // reflow to restart the animation
  el.classList.add('updating');
  setTimeout(function() { el.classList.remove('updating'); }, 600);
}

// Broadcast-delay control (admin only)
function renderDelay() {
  const el = document.getElementById('delay-ctl');
  if (!el) return;
  el.style.display = canAir() ? '' : 'none';
  const v = document.getElementById('delay-val');
  if (v) v.textContent = delaySec + t('sec_short');
}

async function changeDelay(d) {
  const next = Math.max(0, Math.min(60, delaySec + d));
  if (next === delaySec) return;
  delaySec = next;
  delayDirtyUntil = Date.now() + 4000;  // hold local value over server sync while adjusting
  renderDelay();  // optimistic
  try {
    const res = await fetch('/api/delay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds: next }),
    });
    if (res.ok) {
      const j = await res.json();
      if (typeof j.seconds === 'number') { delaySec = j.seconds; renderDelay(); }
    }
  } catch (e) {}
}

function renderSource() {
  const sw = document.getElementById('src-switch');
  if (!sw) return;
  sw.style.display = canAir() ? '' : 'none';
  sw.querySelectorAll('button').forEach(function(b) {
    b.classList.toggle('on', b.getAttribute('data-src') === matchSource);
  });
}

async function setSource(src) {
  try {
    const res = await fetch('/api/source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: src }),
    });
    if (res.ok) {
      matchSource = src;
      previewId = null;
      previewData = null;
      renderSource();
      await fetchState();
    }
  } catch (e) {}
}

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
  updateRoleTag();
  fetchState();
  if (!polling) {
    polling = true;
    setInterval(fetchState, POLL_MS);
    setInterval(renderHeader, 5_000);
    setInterval(tickPoll, 200);
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
      errEl.textContent = t('auth_err_wrong');
    }
  } catch (e) {
    errEl.textContent = t('auth_err_conn');
  }
  return false;
}

async function logout() {
  try { await fetch('/api/logout', { method: 'POST' }); } catch (e) {}
  location.reload();
}

async function fetchState() {
  nextPollAt = Date.now() + POLL_MS;  // reset countdown for this cycle
  try {
    const res = await fetch('/api/status');
    if (res.status === 401) { showAuth(); return; }
    S = await res.json();
    if (typeof S.vmixDelaySec === 'number' && Date.now() >= delayDirtyUntil) delaySec = S.vmixDelaySec;
    if (S.matchSource) matchSource = S.matchSource;
    render();
    flashPoll();
  } catch (e) {
    document.getElementById('hdr-info').textContent = t('auth_err_conn');
  }
}

function render() {
  renderHeader();
  renderHeaderMatch();
  renderMatchList();
  renderActiveCard();
  renderLineup();
  renderEndpoints();
  renderDelay();
  renderSource();
  populateGroupFilter();
}

function renderHeaderMatch() {
  const el = document.getElementById('hdr-match');
  if (!S || !S.match) { el.innerHTML = ''; return; }
  const m = S.match;
  const isNsHdr = (m.time_elapsed || 'notstarted') === 'notstarted';
  const score = isNsHdr ? '–' : esc(String(m.home_score ?? 0)) + ' – ' + esc(String(m.away_score ?? 0));
  const e = m.time_elapsed || 'notstarted';
  const isLive = e === 'firsthalf' || e === 'secondhalf' || e === 'live' || e === 'halftime';
  const isFT = e === 'finished';
  const min = isLive && S.minute ? S.minute + "'" : null;
  const statusLabel = min || (e === 'firsthalf' ? t('badge_h1') : e === 'secondhalf' ? t('badge_h2') : e === 'halftime' ? 'HT' : '');
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
    info.textContent = t('error_prefix') + S.lastError;
  } else if (S.lastUpdated) {
    dot.className = 'dot';
    const d = new Date(S.lastUpdated);
    const sec = Math.round((Date.now() - d) / 1000);
    info.textContent = sec < 5 ? t('just_now') : sec + t('sec_ago');
  }
  renderHeaderMatch();
}

function populateGroupFilter() {
  const sel = document.getElementById('f-group');
  const current = sel.value;
  const groups = [...new Set((S.allMatches || []).map(m => m.group).filter(Boolean))];
  groups.sort();
  sel.innerHTML = '<option value="all">' + esc(t('f_group_all')) + '</option>' +
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
    copy.sort((a, b) => (parseMatchDate(a) || 0) - (parseMatchDate(b) || 0));
  } else if (sort === 'group') {
    copy.sort((a, b) => {
      const ga = GROUP_ORDER.indexOf(a.group), gb = GROUP_ORDER.indexOf(b.group);
      return (ga === -1 ? 99 : ga) - (gb === -1 ? 99 : gb) ||
             (parseMatchDate(a) || 0) - (parseMatchDate(b) || 0);
    });
  } else if (sort === 'status') {
    copy.sort((a, b) => {
      const ra = STATUS_RANK[a.time_elapsed || 'notstarted'] ?? 1;
      const rb = STATUS_RANK[b.time_elapsed || 'notstarted'] ?? 1;
      return ra - rb || (parseMatchDate(a) || 0) - (parseMatchDate(b) || 0);
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
      key = t('group_word') + ' ' + (m.group || '—');
    } else if (sort === 'status') {
      const e = m.time_elapsed || 'notstarted';
      key = (e === 'firsthalf' || e === 'secondhalf' || e === 'live' || e === 'halftime') ? t('grp_live')
          : e === 'finished' ? t('grp_finished')
          : t('grp_upcoming');
    } else if (sort === 'team') {
      key = (m.home_team_name_en || '—')[0].toUpperCase();
    } else {
      const dt = parseMatchDate(m);
      key = dt ? dt.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', timeZone: 'Asia/Dubai' }) : '—';
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
    const isLive = elapsed === 'firsthalf' || elapsed === 'secondhalf' || elapsed === 'live';
    const isHT = elapsed === 'halftime';
    const isFT = elapsed === 'finished';
    const dt = parseMatchDate(m);
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

// Resolves kickoff Date from either worldcup26.ir (local_date + offset) or football-data (utcDate)
function parseMatchDate(m) {
  if (m.utcDate) return new Date(m.utcDate);
  return parseDate(m.local_date, m.venue_utc_offset);
}

function renderMatchList() {
  if (!S?.allMatches?.length) {
    document.getElementById('match-list').innerHTML = '<div style="padding:20px;color:var(--muted)">' + esc(t('no_data')) + '</div>';
    return;
  }

  const { sort } = getFilters();
  const matches = sortMatches(filterMatches(S.allMatches), sort);
  if (!matches.length) {
    document.getElementById('match-list').innerHTML = '<div style="padding:20px;color:var(--muted)">' + esc(t('no_matches')) + '</div>';
    return;
  }

  const grouped = groupMatches(matches, sort);
  let html = '';
  for (const [label, ms] of Object.entries(grouped)) {
    const extra = sort === 'time' ? ' &nbsp;·&nbsp; ' + esc(t('group_word')) + ' ' + esc(ms[0]?.group || '') : '';
    html += '<div class="group-label">' + esc(label) + extra + '</div>';
    for (const m of ms) html += matchRow(m);
  }

  document.getElementById('match-list').innerHTML = html;
}

function matchRow(m) {
  const isVmix = S.activeMatchId === m.id;
  const viewedId = previewId || S.activeMatchId;
  const isPreview = viewedId === m.id;
  const dt = parseMatchDate(m);
  const time = dt ? dt.toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }) : '';
  const score = (m.finished === 'TRUE' || m.time_elapsed !== 'notstarted')
    ? esc(m.home_score) + ' – ' + esc(m.away_score)
    : '– : –';
  const badge = statusBadge(m);
  const homeFlag = '/flags/' + esc(m.home_tla || m.home_team_id) + '.jpg';
  const awayFlag = '/flags/' + esc(m.away_tla || m.away_team_id) + '.jpg';
  const cls = 'match-row' + (isPreview ? ' is-preview' : '') + (isVmix ? ' is-vmix' : '');

  let airBtn = '';
  if (isVmix) {
    airBtn = '<button class="sel-btn vmix" disabled>' + esc(t('air_on')) + '</button>';
  } else if (canAir()) {
    airBtn = '<button class="sel-btn" data-mid="' + esc(m.id) + '" onclick="event.stopPropagation(); handleSelect(this)">' + esc(t('air_send')) + '</button>';
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

  if (e === 'firsthalf' || e === 'secondhalf' || e === 'live') {
    const lbl = min || (e === 'firsthalf' ? t('badge_h1') : e === 'secondhalf' ? t('badge_h2') : 'LIVE');
    return '<span class="badge badge-live">' + lbl + '</span>';
  }
  if (e === 'halftime') return '<span class="badge badge-ht">HT</span>';
  if (e === 'finished') return '<span class="badge badge-ft">FT</span>';

  const dt = parseMatchDate(m);
  const label = dt ? dt.toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }) : '—';
  return '<span class="badge badge-ns">' + label + '</span>';
}

function renderActiveCard() {
  const el = document.getElementById('active-card');
  const titleEl = document.getElementById('match-panel-title');
  const vm = viewModel();
  const m = vm.match;

  if (!m) {
    titleEl.textContent = t('panel_match');
    el.innerHTML = '<div class="no-match">' + t('card_hint') + '</div>';
    return;
  }

  const homeFlag = '/flags/' + esc(m.home_tla || m.home_team_id) + '.jpg';
  const awayFlag = '/flags/' + esc(m.away_tla || m.away_team_id) + '.jpg';
  const te = m.time_elapsed || 'notstarted';
  const minute = (vm.isVmix && S.minute != null) ? S.minute : null;
  const STATUS_LABELS = { firsthalf: t('st_firsthalf'), secondhalf: t('st_secondhalf'), halftime: t('st_halftime'), live: t('st_live'), finished: t('st_finished'), notstarted: t('st_notstarted') };
  const statusLabel = STATUS_LABELS[te] || te;
  const isActiveLive = te === 'firsthalf' || te === 'secondhalf' || te === 'live';
  const isHT = te === 'halftime';
  const isFT = te === 'finished';
  const isNS = te === 'notstarted';
  const dt = parseMatchDate(m);
  const kickoff = dt ? dt.toLocaleString(dateLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }) : '';

  let minuteRow = '';
  if (isActiveLive || isHT || isFT) {
    const minPart = (minute != null && isActiveLive)
      ? '<span class="amin-num">' + minute + "' </span><span class='amin-sep'>·</span>"
      : '';
    minuteRow = '<div class="active-min-row">' + minPart + '<span class="amin-lbl">' + esc(statusLabel) + '</span></div>';
  }

  const rightMeta = isNS ? '🕐 ' + esc(kickoff) : esc(kickoff);

  let banner;
  if (vm.isVmix) {
    titleEl.textContent = t('panel_active');
    banner = '<div class="view-banner on-air"><span>' + esc(t('banner_onair')) + '</span></div>';
  } else {
    titleEl.textContent = t('panel_preview');
    const airBtn = canAir()
      ? '<button class="send-air-btn" data-mid="' + esc(m.id) + '" onclick="handleSelect(this)">▶ ' + esc(t('air_send')) + '</button>'
      : '';
    banner = '<div class="view-banner preview"><span>' + esc(t('banner_preview')) + '</span>' + airBtn + '</div>';
  }

  el.innerHTML = banner + \`<div class="active-card framed">
    <div class="active-teams">
      <div class="active-team">
        <img class="active-flag" src="\${homeFlag}" onerror="this.style.display='none'" alt="">
        <div class="active-name">\${esc(m.home_team_name_en)}</div>
      </div>
      <div class="active-score">\${isNS ? '–' : esc(String(m.home_score ?? 0)) + ' – ' + esc(String(m.away_score ?? 0))}</div>
      <div class="active-team">
        <img class="active-flag" src="\${awayFlag}" onerror="this.style.display='none'" alt="">
        <div class="active-name">\${esc(m.away_team_name_en)}</div>
      </div>
    </div>
    \${minuteRow}
    <div class="active-meta">
      <span class="active-group">\${esc(t('group_word'))} \${esc(m.group || '')}</span>
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
    el.innerHTML = '<div class="no-lineup">' + esc(t('no_lineup')) + '</div>';
    return;
  }

  const hasMatchLineup = players.some(function(p) { return p.Starter !== undefined; });

  if (hasMatchLineup) {
    const starters = players.filter(function(p) { return p.Starter; });
    const bench    = players.filter(function(p) { return !p.Starter; });
    let html = '';
    if (starters.length) {
      html += '<div class="pos-group lineup-section">' + esc(t('starting_xi')) + '</div>';
      html += renderByPosition(starters);
    }
    if (bench.length) {
      html += '<div class="pos-group lineup-section" style="margin-top:8px">' + esc(t('bench')) + '</div>';
      html += renderByPosition(bench);
    }
    el.innerHTML = html;
  } else {
    el.innerHTML = renderByPosition(players);
  }
}

function renderByPosition(players) {
  const groups = {};
  for (const p of players) {
    const pos = p.Position || 'Other';
    (groups[pos] = groups[pos] || []).push(p);
  }
  const order = [...POS_ORDER, ...Object.keys(groups).filter(function(k) { return !POS_ORDER.includes(k); })];
  let html = '';
  for (const pos of order) {
    if (!groups[pos]) continue;
    html += '<div class="pos-group">' + (POS_LABEL[pos] || pos) + '</div>';
    for (const p of groups[pos]) {
      html += \`<div class="player-row"><span class="player-num">\${esc(p.Number)}</span><span class="player-name">\${esc(p.Name)}</span></div>\`;
    }
  }
  return html;
}

function renderEndpoints() {
  // DataSource URLs are only useful for configuring vMix — admin only
  const block = document.getElementById('endpoints-block');
  if (block) block.style.display = canAir() ? '' : 'none';
  if (!canAir()) return;

  const host = window.location.origin;
  const eps = [
    { method: 'JSON', path: '/vmix/score.json',                desc: 'ep_score' },
    { method: 'JSON', path: '/vmix/lineup/home.json',          desc: 'ep_home_full' },
    { method: 'JSON', path: '/vmix/lineup/home/starters.json', desc: 'ep_home_start' },
    { method: 'JSON', path: '/vmix/lineup/home/bench.json',    desc: 'ep_home_bench' },
    { method: 'JSON', path: '/vmix/lineup/away.json',          desc: 'ep_away_full' },
    { method: 'JSON', path: '/vmix/lineup/away/starters.json', desc: 'ep_away_start' },
    { method: 'JSON', path: '/vmix/lineup/away/bench.json',    desc: 'ep_away_bench' },
    { method: 'IMG',  path: '/flags/{teamId}.jpg',             desc: 'ep_flag' },
  ];
  document.getElementById('endpoints').innerHTML = eps.map(e => \`
    <div class="ep">
      <span class="ep-method">\${e.method}</span>
      <div class="ep-info">
        <div class="ep-desc">\${esc(t(e.desc))}</div>
        <div class="ep-path">\${esc(host + e.path)}</div>
      </div>
      <button class="ep-copy" data-url="\${esc(host + e.path)}" onclick="copyEp(this)">\${esc(t('copy'))}</button>
    </div>\`).join('');
}

function copyEp(el) {
  const text = el.dataset.url;
  copyText(text).then(function(ok) {
    const prev = el.textContent;
    el.classList.add('copy-ok');
    el.textContent = ok ? t('copied') : t('copy_manual');
    if (!ok) selectUrlText(el);
    setTimeout(function() { el.classList.remove('copy-ok'); el.textContent = prev; }, 1500);
  });
}

// navigator.clipboard only works in a secure context (HTTPS/localhost).
// The VPS is served over plain HTTP, so fall back to execCommand('copy').
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(function() { return true; }).catch(function() { return fallbackCopy(text); });
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

function selectUrlText(btn) {
  const path = btn.parentElement && btn.parentElement.querySelector('.ep-path');
  if (!path) return;
  const range = document.createRange();
  range.selectNodeContents(path);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function handleSelect(btn) {
  selectMatch(btn.dataset.mid);
}

async function selectMatch(id) {
  const match = S && S.allMatches && S.allMatches.find(function(m) { return m.id === id; });
  const label = match ? match.home_team_name_en + ' vs ' + match.away_team_name_en : t('this_match');
  if (!confirm(t('confirm_air_pre') + label + t('confirm_air_post'))) return;
  await fetch('/api/select/' + id, { method: 'POST' });
  previewId = null;
  previewData = null;
  await fetchState();
}

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

applyStaticI18n();
init();
</script>
</body>
</html>`

export default router
