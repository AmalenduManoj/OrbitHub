import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import * as authApi from '../api/auth';
import { initTokens, setTokens, clearTokens, getAccessToken } from '../api/client';
import type { AuthUserResponse, LoginRequest, RegisterRequest } from '../types';

interface AuthContextValue {
  user: AuthUserResponse | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUserResponse>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeToken(token: string): { exp: number } | null {
  try {
    return jwtDecode<{ exp: number }>(token);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await initTokens();
      const token = getAccessToken();
      const saved = await SecureStore.getItemAsync('user');
      if (token && saved) {
        const decoded = decodeToken(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setUser(JSON.parse(saved));
        } else {
          await clearTokens();
          await SecureStore.deleteItemAsync('user');
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    await setTokens(res.access_token, res.refresh_token);
    await SecureStore.setItemAsync('user', JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    await setTokens(res.access_token, res.refresh_token);
    await SecureStore.setItemAsync('user', JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    await SecureStore.deleteItemAsync('user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUserResponse>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      SecureStore.setItemAsync('user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
