import { UserStatus } from '../types/user-status.enum';

export class UserResponseDto {
  id: string;
  email: string;
  status: UserStatus;
  preferences: Record<string, unknown>;
  createdAt: Date;
}
