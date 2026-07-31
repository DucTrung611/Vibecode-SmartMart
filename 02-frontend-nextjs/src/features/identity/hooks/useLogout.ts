import { useMutation } from "@tanstack/react-query";
import { useSession } from "@/shared/context/session-context";
import * as identityService from "../services/identity.service";

export function useLogout() {
  const { clearSession } = useSession();

  return useMutation({
    mutationFn: () => identityService.logout(),
    onSettled: () => {
      // Clear client state even if the server call fails (e.g. session
      // already invalid) — logout should never strand the user logged in.
      clearSession();
    },
  });
}
