# TEARDOWN — полное удаление без следов

Сервис временный и стоит на **общем** VPS (`89.167.0.70`), где Caddi-контейнер и
docker-сеть `web` обслуживают **другие продакшн-домены** (teqaba, slotforge,
showopc, artes и т.д.). Снимать аккуратно и по порядку.

## ⛔ НЕЛЬЗЯ трогать (общая инфраструктура)

- **Контейнер `caddy`** и его процесс — удалять/перезапускать нельзя, только
  `reload` конфига.
- **Docker-сеть `web`** (`external`) — общая, НЕ удалять.
- **Чужие блоки** в `/srv/infra/Caddyfile` — трогаем только блок `fifa.qplc.dev`.
- **Сертификаты** `/etc/caddy/certs/*` и `/srv/infra/caddy-certs/*` — это общий
  wildcard `*.qplc.dev`, им пользуются другие домены. НЕ удалять.
- **Чужие контейнеры/тома/образы** — удаляем только то, что начинается на
  `footballapi`.
- ⚠️ **Не восстанавливать** `/srv/infra/Caddyfile` из бэкапа `*.bak.1781524686`
  целиком — за месяц в общий файл могли добавиться другие домены. Удалять только
  наш блок (шаг 2).

---

## Параметры (на момент написания)

| Что | Значение |
|---|---|
| Контейнер | `footballapi-app-1` |
| Образ | `footballapi-app:latest` |
| Тома | `footballapi_flags_cache`, `footballapi_state_data` |
| Сеть проекта | `footballapi_default` (своя, удаляется) |
| Каталог | `/home/deploy/projects/footballapi` |
| Порт | `3050` |
| Caddy-блок | `fifa.qplc.dev { … }` — последний блок в `/srv/infra/Caddyfile` |
| Бэкап Caddyfile | `/srv/infra/Caddyfile.bak.1781524686` |
| Домен | `fifa.qplc.dev` (Cloudflare) |

---

## Шаг 1 — Cloudflare (вручную, в дашборде)

1. DNS → удалить запись **`fifa`** (A/CNAME, проксируемую) в зоне `qplc.dev`.
2. Больше ничего не трогать: origin-сертификат `*.qplc.dev` и остальные записи
   нужны другим доменам.

После удаления записи `https://fifa.qplc.dev` перестанет резолвиться.

---

## Шаг 2 — Убрать маршрут из Caddy (общий файл!)

Блок `fifa.qplc.dev` — **последний** в файле. Сначала убедиться в этом, потом
удалить от строки `fifa.qplc.dev {` до конца файла, проверить конфиг и сделать
zero-downtime reload.

```bash
ssh deploy@89.167.0.70

# 2.1 Посмотреть блок (должен быть последним в файле):
grep -n 'fifa.qplc.dev' /srv/infra/Caddyfile
tail -15 /srv/infra/Caddyfile

# 2.2 Бэкап перед правкой:
sudo cp /srv/infra/Caddyfile "/srv/infra/Caddyfile.bak.before-teardown.$(date +%s)"

# 2.3 Удалить блок (от строки 'fifa.qplc.dev {' до конца файла):
sudo sed -i '/^fifa\.qplc\.dev {/,$d' /srv/infra/Caddyfile

# 2.4 Проверить, что наш блок исчез, а чужие на месте:
grep -c 'fifa.qplc.dev' /srv/infra/Caddyfile     # → 0
grep -cE '\.qplc\.dev \{|\.com \{|slotforge' /srv/infra/Caddyfile   # → прежнее число чужих доменов

# 2.5 Проверить и применить конфиг (НЕ перезапуская контейнер):
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

> Если `validate` ругается — откатиться: `sudo cp /srv/infra/Caddyfile.bak.before-teardown.* /srv/infra/Caddyfile` и разобраться.

---

## Шаг 3 — Снести контейнер, тома, образ, сеть проекта

`down -v --rmi all` остановит и удалит контейнер, **именованные тома**
(`flags_cache`, `state_data`), сеть `footballapi_default` и собранный образ.
Внешняя сеть `web` при этом **не удаляется** (так и нужно).

```bash
cd ~/projects/footballapi
docker compose down -v --rmi all
```

Если контейнер почему-то остался прикреплён к `web` и мешает — отключить вручную:
```bash
docker network disconnect web footballapi-app-1 2>/dev/null || true
```

---

## Шаг 4 — Удалить файлы проекта и наши бэкапы

```bash
# Каталог проекта на сервере:
rm -rf ~/projects/footballapi

# Наш исходный бэкап Caddyfile (наш артефакт — можно удалить):
sudo rm -f /srv/infra/Caddyfile.bak.1781524686
sudo rm -f /srv/infra/Caddyfile.bak.before-teardown.*
```

---

## Шаг 5 — Проверка, что следов не осталось

```bash
echo '--- контейнеры ---';  docker ps -a        | grep -i footballapi || echo OK-пусто
echo '--- образы ---';      docker images       | grep -i footballapi || echo OK-пусто
echo '--- тома ---';        docker volume ls    | grep -i footballapi || echo OK-пусто
echo '--- сети ---';        docker network ls   | grep -i footballapi || echo OK-пусто
echo '--- порт 3050 ---';   ss -tlnp | grep ':3050 ' || echo OK-не-слушает
echo '--- каталог ---';     ls -d ~/projects/footballapi 2>/dev/null || echo OK-нет
echo '--- caddy блок ---';  grep -c 'fifa.qplc.dev' /srv/infra/Caddyfile
echo '--- web на месте ---'; docker network ls | grep -w web && echo OK-сеть-web-цела
```

Ожидаемо: всё «OK-пусто/нет», блок fifa = `0`, сеть `web` цела, чужие домены в
Caddyfile не пострадали.

Опционально — отвязать наш контейнер от сети `web`, если что-то залипло, и
убедиться, что caddy жив:
```bash
docker ps | grep -w caddy        # контейнер caddy работает
curl -s -o /dev/null -w '%{http_code}\n' https://teqaba.com   # любой чужой домен жив
```

---

## Шаг 6 — Вне сервера (по желанию, для чистоты)

- **Ключ football-data.org** — он лежит в репозитории (`.env.example`,
  `FOOTBALL_DATA_API_KEY`). После снятия **отозвать/перевыпустить** ключ в личном
  кабинете football-data.org, чтобы он перестал быть валидным.
- **GitHub** — удалить репозиторий `ilyagurev/footballapi` (Settings → Delete
  repository), если он больше не нужен.
- **Локальная копия** — `rm -rf ~/Documents/repo/footballapi` на рабочей машине.
- **Cookie/кэш у операторов** — пароли захардкожены в коде; после удаления репо
  и сервиса они уже неприменимы. Отдельно ничего делать не нужно.

---

## Кратко (если всё штатно)

```bash
# 1. Cloudflare: удалить DNS-запись fifa (вручную)
ssh deploy@89.167.0.70
# 2. Caddy:
sudo cp /srv/infra/Caddyfile "/srv/infra/Caddyfile.bak.before-teardown.$(date +%s)"
sudo sed -i '/^fifa\.qplc\.dev {/,$d' /srv/infra/Caddyfile
docker exec caddy caddy validate --config /etc/caddy/Caddyfile && \
docker exec caddy caddy reload   --config /etc/caddy/Caddyfile
# 3-4. Контейнер/тома/образ/файлы:
cd ~/projects/footballapi && docker compose down -v --rmi all
rm -rf ~/projects/footballapi
sudo rm -f /srv/infra/Caddyfile.bak.1781524686 /srv/infra/Caddyfile.bak.before-teardown.*
# 5. Проверить (см. Шаг 5). 6. Отозвать API-ключ, удалить репо.
```
