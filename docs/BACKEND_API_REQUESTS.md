# Backend API Requests

## Missing Endpoints Required for Complete Authentication Flow

Dear Backend Team,

Based on the authentication API documentation provided (`api-auth.md`), we have successfully integrated the following endpoints:
- ✅ POST /api/auth/register
- ✅ POST /api/auth/login
- ✅ POST /api/auth/refresh
- ✅ POST /api/auth/verify-email

However, we need the following additional endpoints to provide a complete authentication experience:

---

## 🔴 HIGH PRIORITY

### 1. Resend Email Verification OTP

**Endpoint:** `POST /api/auth/resend-verification`

**Description:** Allows users to request a new OTP if they didn't receive the initial one or if it expired.

**Request Body:**
```json
{
  "email": "string"  // Required: User's email address
}
```

**Response:**
```json
{
  "message": "Verification code sent to your email"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid email or user already verified
- `429 Too Many Requests` - Rate limit exceeded (suggest 1 request per 60 seconds)
- `404 Not Found` - User not found

**Notes:**
- Should generate a new 6-digit OTP
- Should invalidate previous OTP for that user
- Should have rate limiting (e.g., max 3 requests per hour per email)
- OTP should expire in 10 minutes (same as registration)

---

### 2. Logout (Revoke Refresh Token)

**Endpoint:** `POST /api/auth/logout`

**Description:** Invalidates the refresh token on the server side for security.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "refreshToken": "string",  // Required: Refresh token to invalidate
  "deviceId": "string"       // Required: Device identifier
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired access token
- `400 Bad Request` - Missing refresh token or device ID

**Notes:**
- Should invalidate the specific refresh token
- Should remove the device session from the database
- Client will clear local storage regardless of response

---

## 🟡 MEDIUM PRIORITY

### 3. Forgot Password (Request Reset)

**Endpoint:** `POST /api/auth/forgot-password`

**Description:** Initiates password reset flow by sending OTP to user's email.

**Request Body:**
```json
{
  "email": "string"  // Required: User's email address
}
```

**Response:**
```json
{
  "message": "Password reset code sent to your email"
}
```

**Error Responses:**
- `404 Not Found` - User not found (or return 200 for security)
- `429 Too Many Requests` - Rate limit exceeded

**Notes:**
- Should generate a 6-digit OTP for password reset
- OTP should expire in 10 minutes
- Should have rate limiting
- Consider returning 200 even if user doesn't exist (security best practice)

---

### 4. Reset Password (Complete Reset)

**Endpoint:** `POST /api/auth/reset-password`

**Description:** Completes password reset using OTP.

**Request Body:**
```json
{
  "email": "string",        // Required: User's email
  "otp": "string",          // Required: 6-digit OTP from email
  "newPassword": "string"   // Required: New password (min 8 characters)
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid OTP or password validation failed
- `404 Not Found` - User not found
- `410 Gone` - OTP expired

**Notes:**
- Should validate OTP
- Should validate password strength (min 8 characters)
- Should invalidate all existing refresh tokens for security
- Should invalidate the OTP after use

---

### 5. Change Password (Authenticated)

**Endpoint:** `POST /api/auth/change-password`

**Description:** Allows authenticated users to change their password.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "currentPassword": "string",  // Required: Current password for verification
  "newPassword": "string"       // Required: New password (min 8 characters)
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid access token or incorrect current password
- `400 Bad Request` - Password validation failed

**Notes:**
- Should verify current password before allowing change
- Should validate new password strength
- Optionally: Invalidate all other refresh tokens except current device
- Optionally: Send email notification about password change

---

## 🟢 LOW PRIORITY (Nice to Have)

### 6. Get Active Sessions

**Endpoint:** `GET /api/auth/sessions`

**Description:** Returns list of all active sessions/devices for the user.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "sessions": [
    {
      "deviceId": "string",
      "deviceName": "string",
      "platform": "string",
      "lastActive": "2025-10-13T17:30:00.000Z",
      "current": true,
      "createdAt": "2025-10-13T10:00:00.000Z"
    }
  ]
}
```

**Notes:**
- `current` should be true for the session making the request
- `lastActive` should update on each API call with that refresh token

---

### 7. Revoke Specific Session

**Endpoint:** `DELETE /api/auth/sessions/:deviceId`

**Description:** Revokes a specific device session.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "Session revoked successfully"
}
```

**Error Responses:**
- `404 Not Found` - Session not found
- `403 Forbidden` - Cannot revoke current session (use logout instead)

---

### 8. Revoke All Other Sessions

**Endpoint:** `POST /api/auth/revoke-all-sessions`

**Description:** Revokes all sessions except the current one.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "All other sessions revoked",
  "revokedCount": 3
}
```

**Notes:**
- Should keep the current session active
- Useful for security when user suspects unauthorized access

---

## Implementation Priority

### Phase 1 (Immediate Need)
1. Resend Email Verification OTP
2. Logout endpoint

### Phase 2 (Next Sprint)
3. Forgot Password
4. Reset Password
5. Change Password

### Phase 3 (Future Enhancement)
6. Get Active Sessions
7. Revoke Specific Session
8. Revoke All Other Sessions

---

## Additional Requests

### Rate Limiting
Please implement rate limiting on:
- `/auth/register` - 5 requests per hour per IP
- `/auth/login` - 10 requests per 15 minutes per IP
- `/auth/resend-verification` - 3 requests per hour per email
- `/auth/forgot-password` - 3 requests per hour per email
- `/auth/verify-email` - 10 requests per hour per email

### Email Notifications
Consider sending email notifications for:
- Password changed
- New device login
- Password reset requested

### Security Enhancements
- Implement refresh token rotation (already done based on docs ✅)
- Consider adding IP address tracking for sessions
- Add user agent tracking for better device identification
- Implement suspicious activity detection

---

## Questions for Backend Team

1. **Token Expiration Times:** 
   - What is the current `ACCESS_TOKEN_TTL`?
   - What is the current `REFRESH_TOKEN_TTL`?

2. **OTP Configuration:**
   - Is OTP expiration time configurable?
   - What's the current OTP expiration (docs say 10 minutes)?

3. **User Verification:**
   - Can users access the app without email verification?
   - Are there any restricted features for unverified users?

4. **Device Sessions:**
   - Is there a limit on concurrent sessions per user?
   - Are old sessions automatically cleaned up?

5. **Error Codes:**
   - Can you provide a complete list of error codes and messages?
   - Should we use specific error codes for different validation failures?

---

## Contact

For any questions or clarifications, please reach out to the frontend team.

Thank you! 🙏
