import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, TOKEN_KEY } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  // Restore the session from a saved token
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // Any API call that returns 401 with a saved token signs the user out
  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    };
    window.addEventListener('taskflow:unauthorized', onUnauthorized);
    return () => window.removeEventListener('taskflow:unauthorized', onUnauthorized);
  }, []);

  const authenticate = useCallback(async (path, payload) => {
    const data = await api(path, { method: 'POST', body: payload });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: (email, password) => authenticate('/auth/login', { email, password }),
      register: (name, email, password) => authenticate('/auth/register', { name, email, password }),
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      },
    }),
    [user, loading, authenticate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
