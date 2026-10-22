# Project Perlica Server

Airport Taxi Sharing API. Requires Node 24.11+ (24.x), npm 11+, and MySQL/MariaDB.

## Run

Copy `.env.example` to `.env` and configure the database and service credentials.

```sh
npm ci
npm run generate
npx prisma migrate deploy
npm run dev
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Run without watching files |
| `npm test` | Isolated tests; no database |
| `npm run check` | Lint, validate schema, test |
| `npm run test:integration` | Database tests |
| `npm run seed` | Development data |

Seeding requires `NODE_ENV=development`, `ENABLE_DEV_SEEDING=true`, and a `DEV_SEED_PASSWORD` of 12–72 UTF-8 bytes. Disable seeding afterward.

[API](docs/api.md)
