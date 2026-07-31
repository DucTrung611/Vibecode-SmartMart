import { registerAs } from '@nestjs/config';

export default registerAs('identity', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshTokenExpiresInDays: parseInt(
    process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? '30',
    10,
  ),
}));
