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

## Integration tests

[Testing tutorial](docs/testing.md): setup, commands, and troubleshooting.

Use a dedicated, disposable MySQL/MariaDB database whose name ends in `_test`,
with migrations already applied. Never point the suite at production or shared
application data; the legacy tests perform writes. Use a database user restricted
to that test database. The name check is only an extra safeguard.

In sh / Git Bash:

```sh
export RUN_INTEGRATION_TESTS=true
export TEST_DATABASE_URL='mysql://USER:PASSWORD@localhost:3306/perlica_test'
npm run test:integration
```

The runner intentionally does not load `.env`. Only these two variables are
required; `TEST_ADMIN_TOKEN`, `TEST_CUSTOMER_TOKEN`, and `TEST_DRIVER_TOKEN` are
no longer needed and are ignored. No running API server or manual login is needed.

Each test receives freshly created admin, customer, and driver accounts with
random tokens, hashed passwords, and a fare. The harness removes those accounts
and their related records after each test and disconnects after each file. Cleanup
is scoped to generated account IDs; it does not reset the database. An interrupted
process may leave fixture records behind, so use a disposable database.

Email, Firebase, and push notifications are mocked; external Axios requests are
blocked. Some legacy registration/OTP and ride/order tests still reference fixed
fixture values and need additional scenario data. Automatic authentication does
not provision those scenarios or make external Maps calls work. Records created
by those legacy scenarios outside the generated accounts are not cleaned up by
the account harness.

[API](docs/api.md)
