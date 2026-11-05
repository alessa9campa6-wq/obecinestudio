import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";

import {
  api,
  setToken,
  setUnauthorizedHandler,
  TOKEN_KEY,
  type User,
} from "@/src/api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    email: string,
    code: string,
    password: string
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve essere usato dentro AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((data: { session_token: string; user: User }) => {
    setToken(data.session_token);
    setUser(data.user);
  }, []);

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });

    const bootstrap = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) return;
        setToken(token);
        const me = await api<User>("/auth/me");
        setUser(me);
      } catch {
        await clearSession();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api<{ session_token: string; user: User }>(
        "/auth/login",
        { method: "POST", body: { email, password } }
      );
      persist(data);
    },
    [persist]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const data = await api<{ session_token: string; user: User }>(
        "/auth/register",
        { method: "POST", body: { email, password, name } }
      );
      persist(data);
    },
    [persist]
  );

  const loginGoogle = useCallback(async () => {
    throw new Error("Accesso con Google non disponibile");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      await clearSession();
    }
  }, [clearSession]);

  const forgotPassword = useCallback(async (email: string) => {
    await api("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  }, []);

  const resetPassword = useCallback(
    async (email: string, code: string, password: string) => {
      await api("/auth/reset-password", {
        method: "POST",
        body: { email, code, password },
      });
      await login(email, password);
    },
    [login]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      loginGoogle,
      logout,
      forgotPassword,
      resetPassword,
    }),
    [
      user,
      loading,
      login,
      register,
      loginGoogle,
      logout,
      forgotPassword,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
