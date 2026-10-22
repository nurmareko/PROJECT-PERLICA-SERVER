# Testing

Run commands using **sh / Git Bash**. Requires Node 24.11+ (24.x), npm 11+, and a running MySQL/MariaDB server for integration tests.

## 1. Install dependencies

```sh
npm ci
npm run generate
```

Skip this step if the project is already installed and the Prisma client is generated.

## 2. Run unit tests

```sh
npm test
```

No database, tokens, or running API server needed.

## 3. Create the test database

Run this SQL in MySQL, phpMyAdmin, or your database GUI:

```sql
CREATE DATABASE project_perlica_test;
```

Use a disposable database ending in `_test`. Never use production or shared application data: integration tests write to the database.

## 4. Configure and migrate

Set these variables in your terminal, not `.env`:

```sh
export RUN_INTEGRATION_TESTS=true
export TEST_DATABASE_URL='mysql://root:@localhost:3306/project_perlica_test'

DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
```

This example uses local `root` with an empty password. Replace the credentials if needed; prefer a database user restricted to this test database. The migration command targets the test database explicitly.

The runner ignores `.env` to avoid loading normal database or service credentials. `.env.test` is not loaded either. Repeat the exports when opening a new terminal.

## 5. Run integration tests

```sh
npm run test:integration
```

Run one file:

```sh
npm run test:integration -- test/integration/admin.test.js
```

No `npm start`, Postman login, or token variables needed. Each test gets temporary admin, customer, and driver accounts, tokens, and a fare. The harness cleans up these accounts and their related records afterward; interrupted runs may leave records behind.

## Limits and troubleshooting

Email, Firebase, and push notifications are mocked. External Axios requests are blocked.

| Result | What to check |
| --- | --- |
| `RUN_INTEGRATION_TESTS must be exactly true` | Run the exports in the same terminal as the tests. |
| `TEST_DATABASE_URL is required` | Set it in the terminal; `.env` is not loaded. |
| Database-name refusal | Use a database name ending in `_test`, with only letters, digits, and underscores. |
| `Unknown database` | Create the database in step 3. |
| Missing tables | Apply migrations in step 4. |
| Connection error or setup timeout | Check MySQL is running, the database exists, and the URL credentials are correct. |
| Registration/OTP or ride/order failures | Legacy tests still use fixed scenario data. Automatic accounts do not provide those fixtures or Maps responses. |

The full integration suite is not yet self-contained. Cleanup covers generated accounts and related records, not unrelated data created by legacy scenarios.
