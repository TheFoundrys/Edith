import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@frontend/services/api/auth";
import type { MeResponse } from "@frontend/services/api/auth";
import { ApiClientError } from "@frontend/services/api/client";

type AuthState = {
  loading: boolean;
  me: MeResponse | null;
  refresh: () => Promise<void>;
  setMe: (me: MeResponse | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.me();
      setMe(data);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 401) setMe(null);
      else setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({ loading, me, refresh, setMe, logout }),
    [loading, me, refresh, logout],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}
