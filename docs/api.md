# API

[Accounts](api-accounts.md) · [Bookings](api-bookings.md) · [Admin](api-admin.md)

## Contract

- Send JSON, or multipart form data for profile uploads (file field: `image`).
- Protected routes require `Authorization: <token>` from login's `data.token`. No `Bearer` prefix; tokens are not JWTs.
- Success: HTTP `200`, body `{ "data": value }`, including creation and logout.
- Errors handled by middleware: `{ "error": { "status": number, "message": string, "additionalData": valueOrNull } }`. Unmatched routes may return HTML.

| Status | Meaning |
| --- | --- |
| 400 | Invalid input or rejected operation |
| 401 | Missing/invalid token or credentials |
| 403 | Disabled account or failed ownership check |
| 404 | Account, booking, or other record not found |
| 500 | Server or dependency failure |
| 503 | Maps call without `GOOGLE_MAPS_API_KEY` |

## Example

```http
POST /api/customers/login
Content-Type: application/json

{"email":"customer@example.com","password":"example-password-only"}
```

For an active, verified account, expect `200` with `{ "data": { "token": "..." } }`. Use the returned token:

```http
GET /api/customers/current
Authorization: <token>
```
