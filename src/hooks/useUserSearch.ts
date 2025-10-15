// src/hooks/useUserSearch.ts

import { useState, useEffect } from 'react';
import { searchUsersAPI, UserSearchResult } from '../api/user';

interface UseUserSearchOptions {
  minLength?: number;
  debounceMs?: number;
  limit?: number;
  excludeIds?: string[];
}

interface UseUserSearchResult {
  users: UserSearchResult[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to search users with debouncing and filtering
 */
export const useUserSearch = (
  query: string,
  options?: UseUserSearchOptions
): UseUserSearchResult => {
  const {
    minLength = 2,
    debounceMs = 300,
    limit = 20,
    excludeIds = [],
  } = options || {};

  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stabilize excludeIds reference to prevent infinite re-renders
  const excludeIdsKey = JSON.stringify(excludeIds);

  useEffect(() => {
    // Clear results if query is too short
    if (query.trim().length < minLength) {
      setUsers([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Debounce the search
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchUsersAPI({
          q: query,
          limit,
        });

        // Filter out excluded IDs on frontend (backend doesn't support this)
        const filteredUsers = response.data.filter(
          (user) => !excludeIds.includes(user.id)
        );

        setUsers(filteredUsers);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || 'Failed to search users';
        setError(errorMessage);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    // Cleanup timeout on query change
    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, minLength, debounceMs, limit, excludeIdsKey]);

  return { users, loading, error };
};
