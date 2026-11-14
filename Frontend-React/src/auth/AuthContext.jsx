import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, apiRequest } from '../services/api';
import { AuthContext } from './authContext';

const tokenStorageKey = 'worthbook_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(tokenStorageKey) || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(sessionStorage.getItem(tokenStorageKey)));
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!token) return undefined;

    let active = true;

    apiRequest('/auth/me', { token })
      .then((authenticatedUser) => {
        if (active) {
          setUser(authenticatedUser);
          setAuthError('');
        }
      })
      .catch((error) => {
        if (!active) return;

        if (error instanceof ApiError && error.status === 401) {
          sessionStorage.removeItem(tokenStorageKey);
          setToken('');
          setUser(null);
        } else {
          setAuthError(error instanceof Error ? error.message : 'Sesi tidak dapat diverifikasi.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const saveSession = useCallback((session) => {
    sessionStorage.setItem(tokenStorageKey, session.token);
    setToken(session.token);
    setUser(session.user);
    setAuthError('');
  }, []);

  const login = useCallback(async (credentials) => {
    const session = await apiRequest('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    saveSession(session);
    return session.user;
  }, [saveSession]);

  const register = useCallback(async (details) => {
    const session = await apiRequest('/auth/register', {
      method: 'POST',
      body: details,
    });
    saveSession(session);
    return session.user;
  }, [saveSession]);

  const logout = useCallback(async () => {
    const previousToken = token || sessionStorage.getItem(tokenStorageKey) || '';
    sessionStorage.removeItem(tokenStorageKey);
    setToken('');
    setUser(null);
    setLoading(false);
    setAuthError('');

    if (!previousToken) return;

    try {
      await apiRequest('/auth/logout', { method: 'POST', token: previousToken });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error;
    }
  }, [token]);

  const value = useMemo(() => ({
    token,
    user,
    loading,
    authError,
    login,
    register,
    logout,
  }), [token, user, loading, authError, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
