import { apiFetch } from "@/shared/lib/api-client";
import { User } from "@/shared/types/user.types";
import {
  AuthResponse,
  LoginInput,
  RegisterInput,
} from "../types/identity.types";

export function register(input: RegisterInput): Promise<User> {
  return apiFetch<User>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
    cache: "no-store",
  });
}

export function refresh(): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/refresh", {
    method: "POST",
    cache: "no-store",
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

export function getProfile(): Promise<User> {
  return apiFetch<User>("/users/me", { cache: "no-store" });
}
