import { useMutation } from "@tanstack/react-query";
import * as identityService from "../services/identity.service";
import { RegisterInput } from "../types/identity.types";

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => identityService.register(input),
  });
}
