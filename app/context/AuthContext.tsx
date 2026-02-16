import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = '@dwelis_admin_auth';

export type User = {
  id: string;
  email?: string;
  phoneNumber?: string;
  fullName?: string;
  role: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  getToken: () => string | null;
  isLoading: boolean;
  roles: string[];
  login: (email: string, password: string) => Promise<void>;
  signupAdmin: (email: string, password: string, fullName?: string, bootstrapToken?: string, options?: { persist?: boolean }) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  verifyEmailWithCode: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  fetchRoles: () => Promise<string[]>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getApiBaseUrl = () => {
  // When served from localhost, always use local backend (avoids production Render)
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return 'http://localhost:4001';
  }
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  const extra = typeof globalThis !== 'undefined' && (globalThis as any).expo?.config?.extra;
  if (extra) {
    const url = (globalThis as any).__DEV__ ? extra.apiBaseUrlDev : extra.apiBaseUrl;
    if (url) return (url as string).replace(/\/$/, '');
  }
  return (globalThis as any).__DEV__ ? 'http://localhost:4001' : 'https://dwelis-backend.onrender.com';
};

const api = axios.create({ baseURL: getApiBaseUrl() });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>(['traveller']);
  const tokenRef = useRef<string | null>(null);

  const persistAuth = useCallback(async (accessToken: string, refreshToken: string, userData: User) => {
    tokenRef.current = accessToken;
    setToken(accessToken);
    setUser(userData);
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken, refreshToken, user: userData }));
  }, []);

  const clearAuth = useCallback(async () => {
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    setRoles(['traveller']);
    delete api.defaults.headers.common.Authorization;
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const getToken = useCallback(() => tokenRef.current, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return false;
      const { refreshToken: storedRefresh } = JSON.parse(raw);
      if (!storedRefresh) return false;
      const res = await api.post('/auth/refresh', { refreshToken: storedRefresh });
      const { accessToken, refreshToken, user: userData } = res.data;
      await persistAuth(accessToken, refreshToken, userData);
      return true;
    } catch {
      await clearAuth();
      return false;
    }
  }, [persistAuth, clearAuth]);

  const fetchRoles = useCallback(async (): Promise<string[]> => {
    try {
      const res = await api.get<{ roles: string[] }>('/users/roles');
      const list = res.data?.roles ?? ['traveller'];
      setRoles(list);
      return list;
    } catch {
      setRoles(['traveller']);
      return ['traveller'];
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<User>('/users/me');
      const userData = res.data;
      if (userData) {
        setUser(userData);
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw);
          stored.user = userData;
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    tokenRef.current = token;
    if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete api.defaults.headers.common.Authorization;
  }, [token]);

  useEffect(() => {
    const interceptorId = api.interceptors.request.use((config) => {
      const t = tokenRef.current;
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    });
    return () => api.interceptors.request.eject(interceptorId);
  }, []);

  // On 401: try refresh token, retry request; if refresh fails, clear auth
  useEffect(() => {
    let refreshPromise: Promise<boolean> | null = null;
    const interceptorId = api.interceptors.response.use(
      (res) => res,
      async (err) => {
        const original = err.config;
        const isRefreshRequest = original?.url?.includes('/auth/refresh');
        if (err?.response?.status === 401 && !original._retry && !isRefreshRequest) {
          original._retry = true;
          try {
            refreshPromise ??= refreshAuth();
            const ok = await refreshPromise;
            if (ok) {
              original.headers = original.headers || {};
              original.headers.Authorization = `Bearer ${tokenRef.current}`;
              return api(original);
            }
          } catch {
            /* refresh failed */
          }
          await clearAuth();
        }
        return Promise.reject(err);
      },
    );
    return () => api.interceptors.response.eject(interceptorId);
  }, [refreshAuth, clearAuth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (cancelled) return;
        if (!raw) { setIsLoading(false); return; }
        const { accessToken, refreshToken, user: storedUser } = JSON.parse(raw);
        if (accessToken && storedUser) {
          tokenRef.current = accessToken;
          setToken(accessToken);
          setUser(storedUser);
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          if (refreshToken) {
            const ok = await refreshAuth();
            if (cancelled) return;
            if (!ok) {
              tokenRef.current = null;
              setToken(null);
              setUser(null);
              delete api.defaults.headers.common.Authorization;
              await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            }
          }
          if (!cancelled && tokenRef.current) await fetchRoles();
        }
      } catch { if (!cancelled) await clearAuth(); }
      finally { if (!cancelled) setIsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [refreshAuth, clearAuth, fetchRoles]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user: userData } = res.data;
    await persistAuth(accessToken, refreshToken, userData);
    await fetchRoles();
  };

  const resendVerificationEmail = async (email: string) => {
    await api.post('/auth/resend-verification-email', { email: email.trim().toLowerCase() });
  };

  const verifyEmailWithCode = async (email: string, code: string) => {
    const res = await api.post('/auth/verify-email-with-code', {
      email: email.trim().toLowerCase(),
      code: code.trim(),
    });
    const { accessToken, refreshToken, user: userData } = res.data;
    await persistAuth(accessToken, refreshToken, userData);
    await fetchRoles();
  };

  const signupAdmin = async (email: string, password: string, fullName?: string, bootstrapToken?: string, options?: { persist?: boolean }) => {
    const res = await api.post('/auth/signup-admin', {
      email,
      password,
      fullName: fullName ?? '',
      ...(bootstrapToken ? { bootstrapToken } : {}),
    });
    const { accessToken, refreshToken, user: userData } = res.data;
    const shouldPersist = options?.persist !== false;
    if (shouldPersist) {
      await persistAuth(accessToken, refreshToken, userData);
      await fetchRoles();
    }
  };

  const logout = async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const { refreshToken: rt } = JSON.parse(raw);
        if (rt) await api.post('/auth/logout', { refreshToken: rt });
      }
    } catch { /* ignore */ }
    await clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        getToken,
        isLoading,
        roles,
        login,
        signupAdmin,
        resendVerificationEmail,
        verifyEmailWithCode,
        logout,
        refreshAuth,
        refreshUser,
        fetchRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export { api };
