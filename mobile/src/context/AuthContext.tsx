import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { authApi, NewAccount, setAuthToken, setUnauthorizedHandler } from '@/lib/api';
import type { User } from '@/types';

const TOKEN_KEY = 'lostlink_token';
const USER_KEY = 'lostlink_user';

interface AuthContextValue {
  user: User | null;
  loading: boolean; // true while the saved session is being restored at app start
  login: (email: string, password: string) => Promise<void>;
  register: (account: NewAccount) => Promise<void>;
  logout: () => Promise<void>;
  /** Saves an updated user returned by the profile endpoints (name or photo changed). */
  updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const saveSession = useCallback(async (token: string, nextUser: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser));
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }, []);

  // Restore the saved session when the app starts.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const savedUser = await SecureStore.getItemAsync(USER_KEY);
        if (!token || !savedUser) return;

        setAuthToken(token);
        setUser(JSON.parse(savedUser));

        // Confirm the token is still valid and pick up any changes (e.g. role).
        try {
          const freshUser = await authApi.me();
          setUser(freshUser);
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(freshUser));
        } catch (error) {
          // A 401 means the token is no longer valid; a network error keeps the saved session.
          if (isAxiosError(error) && error.response?.status === 401) await logout();
        }
      } catch {
        await logout();
      } finally {
        setLoading(false);
      }
    })();

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login(email, password);
      await saveSession(result.token, result.user);
    },
    [saveSession]
  );

  const register = useCallback(
    async (account: NewAccount) => {
      const result = await authApi.register(account);
      await saveSession(result.token, result.user);
    },
    [saveSession]
  );

  const updateUser = useCallback(async (nextUser: User) => {
    setUser(nextUser);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
