# items-cache-api — starter kolokwium

REST API w Node.js + Express, z bazą **Postgres** i pamięcią podręczną **Redis**
(wzorzec *cache-aside* na liście elementów).

## Endpointy

| Method | Path | Opis |
|---|---|---|
| GET | `/health` | sprawdzenie żywotności (zwraca `{"status":"ok"}`) |
| GET | `/items` | lista wszystkich items; odpowiedź buforowana w Redis — nagłówek `X-Cache: HIT` (z cache) lub `MISS` (z bazy) |
| POST | `/items` | tworzy nowy item; body: `{"name":"..."}`; unieważnia cache listy |

## Konfiguracja przez zmienne środowiskowe

| Zmienna | Domyślnie | Opis |
|---|---|---|
| `PORT` | `3000` | port aplikacji |
| `PGHOST` | `db` | host Postgres |
| `PGPORT` | `5432` | port Postgres |
| `PGUSER` | `postgres` | użytkownik Postgres |
| `PGPASSWORD` | `postgres` | hasło Postgres |
| `PGDATABASE` | `items` | nazwa bazy |
| `REDIS_URL` | — | pełny URL Redis (np. `redis://cache:6379`); ma pierwszeństwo |
| `REDISHOST` | `cache` | host Redis (gdy brak `REDIS_URL`) |
| `REDISPORT` | `6379` | port Redis (gdy brak `REDIS_URL`) |
| `CACHE_TTL` | `30` | czas życia cache listy w sekundach |

Aplikacja **sama tworzy tabelę** `items` przy starcie (`CREATE TABLE IF NOT EXISTS`).

## Skrypty npm

- `npm start` — uruchamia serwer (wymaga dostępnych Postgres i Redis).
- `npm test` — uruchamia testy jednostkowe (`node --test`, bez DB/Redis).
- `npm run lint` — uruchamia `scripts/lint.sh`.
- `npm run build` — kopiuje pliki uruchomieniowe do `dist/` (artefakt budowania).

## Co masz do zrobienia (patrz: treść kolokwium)

1. `Dockerfile` aplikacji — **wieloetapowy** (build → obraz finalny tylko z artefaktem i zależnościami produkcyjnymi, nie-root).
2. `compose.yml` z **trzema** serwisami: `app` + `db` (Postgres) + `cache` (Redis), z healthcheckami i gotowością.
3. `.github/workflows/ci.yml` z jobami `lint → test → build/push` obrazu do **GHCR**.

## Smoke test (po napisaniu Dockerfile i compose)

```bash
docker compose up -d --build
sleep 6
curl -i http://localhost:3000/health
curl -X POST -H 'Content-Type: application/json' -d '{"name":"apple"}' http://localhost:3000/items
curl -i http://localhost:3000/items   # pierwsze: X-Cache: MISS
curl -i http://localhost:3000/items   # drugie:   X-Cache: HIT
docker compose down
```
