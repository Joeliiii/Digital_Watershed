# Digital Watershed — Java backend

Spring Boot 4.1.2 / Java 21 replacement for the Node/Express API in `../server`.
Both backends live side by side until cutover (see `../docs/migration/phase0-inventory.md`).

## Status

| Phase | Scope | State |
|---|---|---|
| 1 | Skeleton, MongoDB connection, health, CORS, error format, security baseline | Done |
| 2 | Users, login, JWT | Next |

Every route except `GET /api/health` currently returns `401` — there is no login yet.

## Requirements

- JDK 21 (`java -version`)
- MongoDB reachable from this machine
- Docker (optional) — only for the Testcontainers integration test, which is skipped without it

Maven does not need to be installed; use the wrapper (`mvnw` / `mvnw.cmd`).

## Configuration

All settings come from environment variables (see `src/main/resources/application.yml`
and `../.env.example`). Spring Boot does **not** read `.env` files.

| Variable | Default | Purpose |
|---|---|---|
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string (same name as the Node backend) |
| `MONGO_DATABASE` | `test` | Database name. Overrides any database in the URI path. `test` is where Mongoose put the existing data, because the Node `MONGO_URI` names no database. |
| `PORT` | `8080` | HTTP port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins allowed to call the API |

Automatic index creation is disabled, so the backend never alters the existing database's indexes.

## Run

```bash
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell use `.\mvnw.cmd spring-boot:run`. Check it with:

```bash
curl http://localhost:8080/api/health
```

`{"status":"UP"}` means MongoDB is reachable; `503` with `"DOWN"` means the app is up but the database is not.

To point the React app at this backend, create `../.env.local` with
`VITE_API_URL=http://localhost:8080/api` and run `npm run client` from the repo root.

## Test

```bash
cd backend
./mvnw test
```

## Error format

Every error response has this shape. `message` is always present, because the
React app shows `error.message`:

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Item not found",
  "path": "/api/items/123",
  "timestamp": "2026-11-03T12:00:00Z",
  "fieldErrors": { "title": "must not be blank" }
}
```

`fieldErrors` only appears on validation failures.

## Layout

Package-by-feature under `com.digitalwatershed`:

- `config/` — typed configuration properties
- `security/` — Spring Security setup, password encoding
- `common/` — shared error format and exception handling
- Feature packages (`user`, `media`, `tags`, `projects`, `sharing`, `notes`, `audit`, `storage`) get added in their own phases.
