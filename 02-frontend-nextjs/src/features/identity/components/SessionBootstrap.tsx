"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/shared/context/session-context";
import { setAccessToken } from "@/shared/lib/auth-token";
import * as identityService from "../services/identity.service";

// The access token only lives in memory (shared/lib/auth-token.ts), so a
// full page reload loses it even though the backend session (the httpOnly
// refresh_token cookie) is still valid. This runs once on mount to silently
// restore the session from that cookie before rendering protected content.
export function SessionBootstrap() {
  const { setSession, setLoading } = useSession();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    (async () => {
      try {
        const { accessToken } = await identityService.refresh();
        setAccessToken(accessToken);
        const user = await identityService.getProfile();
        setSession(user, accessToken);
      } catch {
        // No valid refresh cookie — user is simply not logged in.
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
