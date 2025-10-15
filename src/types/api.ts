// src/types/api.ts

/**
 * Standard API error response structure from backend
 */
export interface ApiError {
  message: string;
  statusCode: number;
  errorCode: string;
  data?: any; // Additional error data (e.g., validation errors)
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'statusCode' in error &&
    'errorCode' in error
  );
}
