# Admin

Base path: `/api/admin`. [Shared conventions](api.md).

## Input data

```text
Credentials = { email: string, password: string }
FareUpdate = { fareId: int, farePerKm: int }
DriverAccount = { driverId: int }
CustomerAccount = { customerId: int }
DriverDeactivation = DriverAccount + { reason?: string }
CustomerDeactivation = CustomerAccount + { reason?: string }
```

## Output data

```text
Token = { token: string }
Admin = {
  id: int, username: string, fullName: string, email: string,
  phoneNumber: string, photo: string | null
}
Customer = {
  id: int, email: string, name: string, phoneNumber: string,
  photo: string | null, status: boolean | null, verifiedEmail: boolean | null
}
Driver = Customer + { noMembership: string, licensePlate: string }
Fare = { id: int, farePerKm: int, createDatetime: string, updateDatetime: string }
Order = {
  id: string, lat: number, long: number, status: int,
  customerToAirportDistance: int, farePerKm: string, cost: string,
  driverId: int, customerId: int, rideId: string,
  createDatetime: string, updateDatetime: string,
  driverName: string, customerName: string
}
Ride = {
  id: string, lat: number, long: number, rideStatus: int,
  pickupRadius: int, driverId: int, createDatetime: string,
  updateDatetime: string, driverName?: string
}
AccountResult = { email: string, name: string }
```

## Public routes

| Method/path | Input → data | Effect / failures |
| --- | --- | --- |
| POST `/login` | Credentials → Token | Replace UUID session token; set expiry one calendar day later. 401 missing admin, wrong password, or password over 72 UTF-8 bytes. |

## Protected routes

| Method/path | Input → data | Effect / failures |
| --- | --- | --- |
| GET `/getCurrent` | none → Admin | Read caller's profile. 404 missing admin. |
| GET `/getDriver` | none → Driver[] | List all drivers. |
| GET `/getCustomer` | none → Customer[] | List all customers. |
| GET `/getFare` | none → Fare or null | Return unordered first fare; not scoped to caller. |
| PATCH `/updateFare` | FareUpdate → `{ id: int }` | Update fare and assign caller's admin ID; uniqueness constraints apply. 404 missing fare; no missing-admin guard. |
| PATCH `/activateDriverAccount` | DriverAccount → AccountResult | Set status true; email driver. 404 missing account; 400 already active. |
| PATCH `/deactivateDriverAccount` | DriverDeactivation → AccountResult | Set status false; email driver. 404 missing account; 400 already inactive. |
| PATCH `/activateCustomerAccount` | CustomerAccount → AccountResult | Set status true; email customer. 404 missing account; 400 already active. |
| PATCH `/deactivateCustomerAccount` | CustomerDeactivation → AccountResult | Set status false; email customer. 404 missing account; 400 already inactive. |
| GET `/getOrderan` | none → Order[] | List all orders. |
| GET `/getRide` | none → Ride[] | List all rides. |
| DELETE `/logout` | none → `"OK"` | Clear token, retain expiry. 404 missing admin. |
