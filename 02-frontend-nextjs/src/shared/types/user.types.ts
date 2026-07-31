export type UserStatus = "active" | "suspended";

export interface User {
  id: string;
  email: string;
  status: UserStatus;
  preferences: Record<string, unknown>;
  createdAt: string;
}
