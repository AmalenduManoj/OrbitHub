import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { setTokens, clearTokens, getAccessToken } from '../api/client';
import type { AuthUserResponse, LoginRequest, RegisterRequest } from '../types';

interface AuthContextValue {
  user: AuthUserResponse | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session from stored tokens
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // Decode JWT payload to check expiry
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        clearTokens();
        setLoading(false);
        return;
      }
      // Valid token — try fetching current user info
      // We'll decode user info from a lightweight endpoint later; for now just mark ready
      setLoading(false);
    } catch {
      clearTokens();
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
