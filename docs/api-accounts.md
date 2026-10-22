# Accounts

Base path: `/api/{role}`, where role is `customers` or `drivers`. [Shared conventions](api.md).

## Input data

```text
Registration = { email, name, phoneNumber, password }       // strings
DriverRegistration = Registration + { noMembership, licensePlate }
Email = { email: string }
Credentials = { email: string, password: string }
OTP = { email: string, otp: string }                       // four ASCII digits
PasswordChange = { oldPassword: string, newPassword: string } // must differ
Location = { latitude: number, longitude: number }         // no coordinate bounds
Device = { deviceToken: string }
ProfileUpdate = { name: string, phoneNumber: string, image?: File }
DriverProfileUpdate = ProfileUpdate + { noMembership: string, licensePlate: string }
```

## Output data

```text
EmailResult = { email: string }
Token = { token: string }
Profile = {
  email: string, name: string, phoneNumber: string,
  token: string | null, photo: string | null,
  lat: number | null, long: number | null
}
DriverProfile = Profile + { noMembership: string, licensePlate: string }
AccountRecord = Profile + {
  id: number, password: string, otp: string | null,
  deviceToken: string | null, tokenExpiry: string | null,
  otpExpiry: string | null, verifiedEmail: boolean | null,
  status: boolean | null, createDatetime: string, updateDatetime: string
} // drivers also include noMembership and licensePlate
```

## Public routes

| Method/path | Input → data | Effect / failures |
| --- | --- | --- |
| POST (base) | Registration → EmailResult | Create inactive account; email OTP. 400 duplicate email; 500 mail failure. |
| POST `/verificationEmailRegister` | OTP → EmailResult | Clear OTP, verify email; activate customers only. 400 invalid/expired OTP; 404 missing account. |
| POST `/resendOTPEmailRegister` | Email → EmailResult | Replace/email OTP. 400 already verified; 404 missing account; 500 mail failure. |
| POST `/login` | Credentials → Token | Replace token; set 24-hour expiry. 401 missing account, wrong password, or unverified email. Inactive: customer 403, driver 401. |
| POST `/forgotPassword` | Email → EmailResult | Email recovery OTP. 404 missing/unverified account; 500 mail failure. |
| POST `/verificationEmailForgotPassword` | OTP → EmailResult | Clear OTP/expiry. 400 invalid/expired OTP; 404 missing account. |
| POST `/resendOTPEmailForgotPassword` | Email → EmailResult | Replace/email recovery OTP. 404 missing account; 500 mail failure. |
| PATCH `/resetPassword` | Credentials → EmailResult | Replace password without proof of recovery. 400 missing/unverified account. |

## Protected routes

| Method/path | Input → data | Effect / failures |
| --- | --- | --- |
| GET `/checkAuthentication` | none → `{ token: string or null }` | Return stored token. |
| GET `/current` | none → Profile or DriverProfile | Read profile. |
| PATCH `/current` | ProfileUpdate or DriverProfileUpdate → EmailResult | Update profile; upload/storage failures return 500. |
| PATCH `/changePassword` | PasswordChange → AccountRecord | Replace hash. 401 wrong old password. |
| PATCH `/updateLocation` | Location → EmailResult | Store latitude as `lat`, longitude as `long`. |
| PATCH `/updateDeviceToken` | Device → Device | Store notification token. |
| DELETE `/logout` | none → `"OK"` | Clear session token; retain device token and expiry. |
