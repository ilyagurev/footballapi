# Artes FIFA — vMix Data Bridge

Мост «данные о матчах → vMix» для трансляций FIFA World Cup 2026. Сервис тянет
данные о матчах из публичных источников, готовит их в формате vMix **DataSource
(JSON)** и отдаёт по HTTP. Оператор выбирает матч в веб-интерфейсе — выбранный
матч уходит в эфир, vMix подтягивает счёт, таймер, флаги и составы.

> ⚠️ **Временный проект.** Разворачивается на время турнира. Полная процедура
> удаления с сервера без следов — в [TEARDOWN.md](TEARDOWN.md). Удалить
> ориентировочно через месяц после окончания использования.

---

## Что показывает

- **Титр счёта** (`/vmix/score.json`): команды, группа, счёт, минута матча,
  статус, время начала по Дубаю, URL флагов.
- **Титры составов** (`/vmix/lineup/home.json`, `/vmix/lineup/away.json`):
  игроки с номером и позицией (GK/DEF/MID/FWD).
- **Флаги** (`/flags/{teamId}.jpg`): высокого качества (flagcdn.com), 800×533,
  единый размер и соотношение сторон 3:2.

---

## Как работает (поток данных)

```
worldcup26.ir ─┐                         ┌─ /vmix/score.json
(матчи/команды/ │   ┌──────────────┐      ├─ /vmix/lineup/home.json   ← vMix тянет
 стадионы)      ├──▶│  Node/Express │─────┼─ /vmix/lineup/away.json     (pull, без auth)
football-data  ─┘   │  poller 10s  │      └─ /flags/{id}.jpg
.org (минута/       │  in-memory   │
 составы)           └──────┬───────┘      ┌─ /            веб-интерфейс  ← оператор
                           │              ├─ /api/*       (под паролем)
                  state на диске:         └─ выбор матча → активный матч в эфир
                  /app/data/active.json
```

- **Опрос** каждые 10 секунд: список матчей обновляется целиком; для активного
  матча подтягивается живая минута (football-data.org) и составы.
- **vMix** на отдельной машине **тянет** JSON-эндпоинты сам (pull). Эти
  эндпоинты **публичные** (без авторизации) — vMix не умеет cookie-логин.
- **Веб-интерфейс и `/api/*`** закрыты паролем.
- **БД нет.** Состояние в памяти; на диск пишется только `activeMatchId`
  (чтобы эфир пережил рестарт) и кэш флагов.

### Источники данных

| Источник | Эндпоинты | Auth | Что даёт |
|---|---|---|---|
| worldcup26.ir | `/get/games`, `/get/teams`, `/get/stadiums` | не требуется | расписание, счёт, статус, команды, стадионы (→ таймзона) |
| football-data.org | `/v4/matches?status=IN_PLAY,PAUSED`, `/v4/competitions/WC/teams` | `X-Auth-Token` | живая минута матча, составы |

Таймзона матчей восстанавливается по `region` стадиона (Eastern −4 / Central −5
/ Western −7), `local_date` источника — это **местное время стадиона**, не UTC.
Всё отображение — в `Asia/Dubai`.

---

## Доступ

При открытии страницы — поле пароля. Два захардкоженных пароля (см.
[src/auth.js](src/auth.js)):

| Пароль | Роль | Права |
|---|---|---|
| `artes2026admin` | admin | просмотр + отправка матча в эфир (vMix) + видит DataSource URL |
| `artes2026` | viewer | только просмотр (без кнопок «в эфир», без блока URL) |

Сессия — HttpOnly-cookie с HMAC-подписью, **30 дней**. Язык интерфейса EN/RU
(переключатель в шапке, по умолчанию английский, выбор в cookie `lang`).

---

## Стек и структура

Node.js 20 (ES modules) + Express. Без БД. Зависимости: `express`, `sharp`
(конвертация флагов), `dotenv`.

```
src/
├── index.js              # Express, маршруты, auth-эндпоинты, запуск
├── poller.js             # цикл опроса 10с, обновление состояния, составы
├── state.js              # in-memory состояние
├── auth.js               # пароли→роли, HMAC-cookie, requireAuth/requireAdmin
├── persist.js            # activeMatchId → /app/data/active.json
├── lib/http.js           # fetchJsonRetry — ретраи/бэкофф для внешних API
├── sources/
│   ├── worldcup.js       # клиент worldcup26.ir
│   └── footballdata.js   # клиент football-data.org (минута + составы)
├── flags/
│   ├── converter.js      # скачивание+конвертация флагов в JPG (sharp)
│   └── iso2-map.js       # FIFA-код → ISO2 для flagcdn.com (48 сборных)
└── routes/
    ├── vmix.js           # /vmix/*.json (публичные DataSource)
    ├── flags.js          # /flags/{id}.jpg
    └── ui.js             # весь веб-интерфейс (HTML+CSS+JS в одном файле, i18n)
```

### HTTP-эндпоинты

| Метод | Путь | Auth | Назначение |
|---|---|---|---|
| GET | `/` | — (форма входа) | веб-интерфейс |
| POST | `/api/login` | — | вход по паролю → cookie |
| POST | `/api/logout` | — | выход |
| GET | `/api/me` | cookie | текущая роль |
| GET | `/api/status` | любая роль | состояние (матчи, активный, составы) |
| GET | `/api/preview/:id` | любая роль | данные матча без отправки в эфир |
| POST | `/api/select/:id` | **admin** | отправить матч в эфир (vMix) |
| GET | `/vmix/score.json` | **публичный** | титр счёта для vMix |
| GET | `/vmix/lineup/home.json` | **публичный** | состав хозяев |
| GET | `/vmix/lineup/away.json` | **публичный** | состав гостей |
| GET | `/flags/{teamId}.jpg` | **публичный** | флаг (JPG) |

---

## Конфигурация (.env)

```
PORT=3050
FOOTBALL_DATA_API_KEY=<ключ football-data.org>
WC_JWT_TOKEN=                  # опц., публичные эндпоинты worldcup26.ir работают без него
AUTH_SECRET=                   # опц., секрет подписи cookie (есть стабильный дефолт в коде)
# TZ=Asia/Dubai                # задаётся в docker-compose
# DATA_DIR=                    # опц., путь для active.json (дефолт ./data → /app/data в контейнере)
```

---

## Развёртывание (VPS)

Сервер: `89.167.0.70`, пользователь `deploy`, проект в `~/projects/footballapi`,
контейнер `footballapi-app-1`, порт `3050`.

```bash
# Обновить и пересобрать:
cd ~/projects/footballapi && git pull && docker compose up -d --build

# Логи:
docker compose logs --tail 30

# Состояние (нужна admin-cookie):
curl -s -c /tmp/c -X POST http://localhost:3050/api/login \
  -H 'Content-Type: application/json' -d '{"password":"artes2026admin"}' >/dev/null
curl -s -b /tmp/c http://localhost:3050/api/status | head -c 200
```

### Сеть и домен

Публичный адрес — **https://fifa.qplc.dev** (Cloudflare → Caddy → контейнер).

- Cloudflare: DNS-запись `fifa` (проксируется), origin-сертификат `*.qplc.dev`.
- На VPS 80/443 держит **общий контейнер `caddy`** (фронтит и другие домены).
- Маршрут добавлен блоком в **общий** `/srv/infra/Caddyfile`
  (`fifa.qplc.dev → footballapi-app-1:3050`); контейнер подключён к общей docker-сети `web`.
- Express работает за прокси: `trust proxy` (даёт `https` в URL флагов),
  cookie получает флаг `Secure` на HTTPS.

> Подробности инфраструктуры и **как всё это снять** — в [TEARDOWN.md](TEARDOWN.md).

### Тома (Docker volumes)

| Том | Монтируется | Содержит |
|---|---|---|
| `footballapi_flags_cache` | `/app/cache/flags` | сконвертированные JPG-флаги |
| `footballapi_state_data` | `/app/data` | `active.json` — матч в эфире (переживает рестарт) |

---

## Настройка vMix

В vMix добавить **Data Sources → Web/JSON**, URL (кнопка «Copy» в интерфейсе под
admin даёт готовые ссылки с доменом):

- Счёт: `https://fifa.qplc.dev/vmix/score.json`
- Состав хозяев: `https://fifa.qplc.dev/vmix/lineup/home.json`
- Состав гостей: `https://fifa.qplc.dev/vmix/lineup/away.json`
- Флаги: поля `HomeFlagUrl` / `AwayFlagUrl` в `score.json` (готовые URL картинок)

Эндпоинты отдают `Cache-Control: no-store`; vMix опрашивает их по своему интервалу.

---

## Удаление без следов

Это временный сервис на **общем** сервере. Порядок полного снятия (Cloudflare,
Caddy, контейнер, тома, образ, файлы) с проверками и предупреждениями о том, что
**нельзя** трогать (общая сеть `web`, чужие блоки Caddy, общий сертификат) —
см. **[TEARDOWN.md](TEARDOWN.md)**.
