import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/shared/context/session-context";
import * as identityService from "../services/identity.service";

export function useCurrentUser() {
  const { user, isLoading } = useSession();

  return useQuery({
    queryKey: ["identity", "me"],
    queryFn: identityService.getProfile,
    enabled: !isLoading && user !== null,
    initialData: user ?? undefined,
  });
}
