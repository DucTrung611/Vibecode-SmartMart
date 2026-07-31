import { useMutation } from "@tanstack/react-query";
import { useSession } from "@/shared/context/session-context";
import { setAccessToken } from "@/shared/lib/auth-token";
import * as identityService from "../services/identity.service";
import { LoginInput } from "../types/identity.types";

export function useLogin() {
  const { setSession } = useSession();

  return useMutation({
    mutationFn: (input: LoginInput) => identityService.login(input),
    onSuccess: async (result) => {
      // Token must be set before getProfile() so its Authorization header
      // is populated — setSession() below re-sets it, which is harmless.
      setAccessToken(result.accessToken);
      const user = await identityService.getProfile();
      setSession(user, result.accessToken);
    },
  });
}
