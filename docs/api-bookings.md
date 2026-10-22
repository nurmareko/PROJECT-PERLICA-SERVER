# Bookings

Base paths: `/api/customers/orders`, `/api/drivers/orders`, `/api/drivers/rides`. [Shared conventions](api.md).

## Input data

```text
NewOrder = { rideId: string, latitude: number, longitude: number }
OrderId = { orderId: string }
Message = OrderId + { message: string }                    // also reports
Review = OrderId + { rating: number, review?: string | null }
OrderStatus = OrderId + { status: int }
DriverLocation = { latitude: number | null, longitude: number | null }
NewRide = { lat: number, long: number, pickupRadius: int }  // radius in meters
RideId = { rideId: string }
```

## Output data

```text
Location = { lat: number | null, long: number | null }
Order = { id: string, lat: number, long: number, status: int,
  customerToAirportDistance: int, farePerKm: string, cost: string,
  rideId: string, customerId: int }
RideFields = { id: string, lat: number, long: number, pickupRadius: int, rideStatus: int }
Ride = RideFields + { driverId: int }
Times = { createDatetime: string, updateDatetime: string }
Driver = Location + { id: int, name: string, licensePlate: string, photo: string | null }
Customer = { id: int, name: string, phoneNumber: string, photo: string | null }

CustomerCurrent = Order + {
  driver: Driver + { noMembership: string, phoneNumber: string, averageRating: number },
  estimationDuration: string, estimationDistance: string, rideInfo: Ride }
CustomerHistory = Order + Times + { driverId: int, driver: Driver, review: DriverReview }
DriverReview = { id: int, orderId: string, driverRating: number | null,
  driverReview: string | null } OR { driverReview: "Tidak Ada Review", driverRating: 0 }
DriverCurrent = Order + { driverId: int, ride: Ride,
  customer: Customer + { email: string, averageRating: number } }
DriverHistory = Order + Times + { driverId: int, customer: Customer, review: CustomerReview }
CustomerReview = { id: int, orderId: string, customerRating: number | null,
  customerReview: string | null } OR { customerReview: "Tidak Ada Review", customerRating: 0 }

Discovery = { customerLocation: Location + { address: string },
  availableRidesCount: int, rides: DiscoveredRide[] }
DiscoveredRide = { id: string, lat: number, long: number, rideStatus: int, pickupRadius: int,
  createDateTime: string, updateDateTime: string,
  driverInfo: Driver + { averageRating: number },
  distances: { driverToCustomerDistanceEstimate: string, customerToAirportDistanceEstimate: string },
  durations: { driverToCustomerDurationEstimate: string, customerToAirportArrivalDurationEstimate: string },
  estimatedCost: string }
```

## Public routes

None.

## Protected routes

### Customer orders

Base path: `/api/customers/orders`.

| Method/path | Input → data | Effect / failures |
| --- | --- | --- |
| GET `/getTaxisWithinRadius` | none → Discovery | Saved customer location; rides at `0,1` with no orders or only `5,6,7`, within pickup radius (Haversine). Empty: count `0`, rides `[]`. First airport/fare; missing fare means zero. |
| GET `/getCurrentOrder` | none → CustomerCurrent | Caller's status `0,1,2,3`; 404 `no_current_order`. At `0`, driver coordinates forced to `0`, estimates `"0 menit"`/`"0.0 km"`; at `1,2`, driver → pickup; at `3`, driver → airport. |
| POST `/addOrder` | NewOrder → `{ id: string }` | Create at `0`, default review and notification. 400 existing customer order outside `4,5,6,7`, ride at `2,3`, or ride order outside `5,6,7` (including completed `4`). No radius recheck; saved coordinates determine distance/cost, body coordinates determine pickup. Fare rounds to integer, cost to nearest 1,000 (IDR text). |
| PATCH `/cancelOrder` | OrderId → `{ id: string }` | Return order ID; write `5`. 400 at `4,5,6,7`: `Order cannot be cancelled`; wrong owner: 403 `Order does not belong to the customer`. |
| GET `/getHistoryOrder` | none → CustomerHistory[] | Caller's status `4,5,6,7`. |
| POST `/sendMessage` | Message → `{ id: int }` | Return caller ID; optional push, then store Message and Notification. No participation check. |
| POST `/sendReport` | Message → `{ id: int }` | Return caller ID; email, then store Report. No participation check. |
| PATCH `/sendReview` | Review → `{ id: int }` | Return caller ID; write `customerRating`/`customerReview`. No participation check. |

### Driver orders

Base path: `/api/drivers/orders` (not `/orderan`).

| Method/path | Input → data | Effect / failures |
| --- | --- | --- |
| GET `/getCurrentOrderan` | none → DriverCurrent | Caller's status `0,1,2,3`; 404 `no_current_orderan`. Customer average filters nonzero `driverRating` but averages `customerRating`, without rounding. |
| PATCH `/rejectOrderan` | OrderId → `{ driverId: int }` | `0 → 7`; otherwise 400 `Order cannot be rejected`. Wrong owner may cause 500, not 403. |
| PATCH `/acceptOrderan` | OrderId → `{ driverId: int }` | `0 → 1`; otherwise 400 `Order cannot be accepted`. Wrong owner may cause 500, not 403. |
| PATCH `/cancelOrderan` | OrderId → `{ driverId: int }` | `1,2,3 → 6`; otherwise 400 `Order cannot be cancelled`. Wrong owner may cause 500, not 403. |
| GET `/getHistoryOrderan` | none → DriverHistory[] | Caller's status `4,5,6,7`. |
| PATCH `/updateStatusOrderan` | OrderStatus → `{ driverId: int, cost: string }` | Write supplied status; source must be `1,2,3`, else 400 `Order cannot be updated due to its current status`. Wrong owner: 404. No destination allowlist or forward-only rule. |
| PATCH `/updateLocationOrderan` | DriverLocation → Location + `{ id: int }` | Update caller driver, not order/ride; notify customers of caller's orders at `1,2,3`. Notification text repeats latitude; data correctly includes `driverLat`/`driverLong`. |
| POST `/sendMessage` | Message → `{ id: int }` | Return caller ID; push only if customer has token; store no Message/Notification. No participation check. |
| POST `/sendReport` | Message → `{ id: int }` | Return caller ID; email only, no stored Report. No participation check. |
| PATCH `/sendReview` | Review → `{ id: 2 }` (constant) | Write `driverRating`/`driverReview`; wrong owner: 403 `Driver not associated with this order`. |

### Driver rides

Base path: `/api/drivers/rides`.

| Method/path | Input → data | Effect / failures |
| --- | --- | --- |
| GET `/getCurrentRide` | none → RideFields + Times | Caller's status `0,1`; 404 `no_current_ride`. `updateDatetime` is server time now, not stored time; missing creation time becomes `""`. |
| POST `/addRide` | NewRide → `{ id: string, driverId: int }` | Override ID, driver ID, status (`0`), then forward whole body to Prisma; extra fields are not allowlisted or a supported arbitrary-write contract. 400 caller order at `0,1,2,3`: `Cannot add new ride: existing order status is 0, 1, 2, or 3`; ride at `0,1`: `Ada pengantaran yang belum selesai`. |
| PATCH `/completeRide` | RideId → `{ driverId: int }` | Return target driver; any source → `1`. No ownership/active-order check. |
| PATCH `/completeAndCloseRide` | RideId → `{ driverId: int }` | Return target driver; `1 → 3`, else 400 `Ride cannot be complated and closed`. No ownership/active-order check. |
| PATCH `/cancelRide` | RideId → `{ driverId: int }` | Return target driver; `0 → 2`, else 400 `Ride cannot be cancelled`. No ownership/active-order check. |
| GET `/getHistoryRide` | none → (Ride + Times)[] | Caller's status `2,3`; stored timestamps. |
