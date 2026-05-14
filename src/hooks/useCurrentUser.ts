import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../api_users';

/**
 * Decode a JWT token payload without a library.
 * Returns null if the token is missing or malformed.
 */
function decodeJwt(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const USER_CACHE_KEY = 'cachedUser';

/**
 * Hook to fetch the current authenticated user.
 * Priority order:
 *   1. JWT token decode  — instant, works offline
 *   2. localStorage cache — persists across app restarts offline
 *   3. API /users/me     — freshest data when online
 */
export function useCurrentUser() {
  // Seed initial state immediately from JWT (no async, no flash)
  const [user, setUser] = useState<any>(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        return {
          username: payload.username,
          user_id: payload.user_id,
          is_admin: payload.is_admin,
          terminal: payload.terminal,
          businessId: payload.businessId,
          status: payload.status,
        };
      }
    }
    // Fallback to cached API response from previous successful fetch
    const cached = localStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  });

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        // Cache the fresh API response for offline use next time
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
      } catch (error) {
        // Silently fall back to the JWT-decoded / cached value already in state
        console.warn('Could not refresh user from API (offline?), using cached data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = useCallback(async () => {
    localStorage.removeItem(USER_CACHE_KEY);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  }, [navigate]);

  return {
    user,
    loading,
    employeeId: user?.user_id || '',
    handleLogout,
  };
}
