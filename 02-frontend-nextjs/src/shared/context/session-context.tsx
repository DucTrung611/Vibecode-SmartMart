"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { User } from "@/shared/types/user.types";
import { setAccessToken } from "@/shared/lib/auth-token";

interface SessionContextValue {
  user: User | null;
  isLoading: boolean;
  setSession: (user: User, accessToken: string) => void;
  clearSession: () => void;
  setLoading: (isLoading: boolean) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      isLoading,
      setSession: (nextUser, accessToken) => {
        setAccessToken(accessToken);
        setUser(nextUser);
      },
      clearSession: () => {
        setAccessToken(null);
        setUser(null);
      },
      setLoading: setIsLoading,
    }),
    [user, isLoading],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
