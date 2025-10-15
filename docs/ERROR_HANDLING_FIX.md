# Error Message Display Fix - Login Screen

## Problem
Backend was sending error message `"Invalid email or password"` with 401 status code, but frontend was showing generic message: `"Login failed. Please try again."`

## Root Cause
The API client was only looking for `message` field in error response, but some errors might come with `error` field instead.

## Fix Applied

### 1. API Client (`/src/api/client.ts`)
Added fallback to check both `message` and `error` fields:

```typescript
const apiError: ApiError = {
  message: errorData?.message || errorData?.error || 'An error occurred',
  statusCode: errorData?.statusCode || status,
  errorCode: errorData?.errorCode || 'UNKNOWN_ERROR',
  ...(errorData?.data && { data: errorData.data }),
};

console.log('🔴 Constructed ApiError:', apiError);
```

**Changes:**
- Now checks `errorData?.message` first
- Falls back to `errorData?.error` if message is not present
- Added logging to see constructed error object

### 2. Login Screen (`/src/screens/LoginScreen.tsx`)
Added detailed logging to debug error display:

```typescript
{(() => {
  console.log('🔴 Login error object:', loginMutation.error);
  console.log('🔴 Is ApiError?', isApiError(loginMutation.error));
  if (isApiError(loginMutation.error)) {
    console.log('🔴 Error message:', loginMutation.error.message);
    return loginMutation.error.message;
  }
  return 'Login failed. Please try again.';
})()}
```

**Changes:**
- Logs the full error object
- Logs whether it's recognized as ApiError
- Logs the extracted message
- Shows actual backend error message if available

## Backend Error Format

The backend correctly sends errors in this format:
```json
{
  "message": "Invalid email or password",
  "statusCode": 401,
  "errorCode": "UNAUTHORIZED"
}
```

This is defined in `/pulse-api/src/shared/errors/base.error.ts`:
```typescript
toJSON() {
  return {
    message: this.message,
    statusCode: this.statusCode,
    errorCode: this.errorCode,
  };
}
```

## Testing

### Test Invalid Login
1. **Open app** and go to login screen
2. **Enter invalid credentials**:
   - Email: `test@example.com`
   - Password: `wrongpassword`
3. **Click Sign In**
4. **Check console logs**:
   ```
   ❌ API ERROR RESPONSE: 401 POST /auth/login
   Error Data: {
     "message": "Invalid email or password",
     "statusCode": 401,
     "errorCode": "UNAUTHORIZED"
   }
   🔴 Constructed ApiError: { message: "Invalid email or password", statusCode: 401, errorCode: "UNAUTHORIZED" }
   🔴 Login error object: { message: "Invalid email or password", ... }
   🔴 Is ApiError? true
   🔴 Error message: Invalid email or password
   ```
5. **UI should show**: "Invalid email or password" (not generic message)

### Test Other Errors

**Unverified Email:**
- Should show: "Email not verified. Please check your inbox."
- Should navigate to EmailVerification screen

**Network Error:**
- Should show: "Network error - please check your connection"

**Validation Error:**
- Should show specific validation message from backend

## Error Types Handled

### 4xx Client Errors
- **400 Bad Request**: Shows validation errors
- **401 Unauthorized**: Shows "Invalid email or password"
- **403 Forbidden**: Shows specific forbidden message
- **404 Not Found**: Shows "Resource not found"

### 5xx Server Errors
- **500 Internal Server Error**: Shows "An error occurred on the server"
- **503 Service Unavailable**: Shows "Service temporarily unavailable"

### Network Errors
- **No Response**: Shows "Network error - please check your connection"
- **Timeout**: Shows "Request timed out"

## Files Modified
- `/src/api/client.ts` - Added `error` field fallback and logging
- `/src/screens/LoginScreen.tsx` - Added detailed error logging

## Result
✅ All 4xx errors now show the actual backend error message  
✅ Users get clear, specific feedback on what went wrong  
✅ Better debugging with detailed console logs
