import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../api_users';

/**
 * Hook to fetch the current authenticated user.
 * Replaces the duplicate fetchUser + handleLogout patterns across 6+ pages.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = useCallback(async () => {
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
