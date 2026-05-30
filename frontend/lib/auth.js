'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, getToken, setToken, removeToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const data = await authApi.me();
      setUser(data.user);
    } catch {
      removeToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    router.push('/dashboard');
  };

  const register = async (username, email, password) => {
    const data = await authApi.register({ username, email, password });
    setToken(data.token);
    setUser(data.user);
    router.push('/dashboard');
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};