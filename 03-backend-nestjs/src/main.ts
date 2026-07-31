import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use(cookieParser());
  // credentials:true is required so the browser accepts the httpOnly
  // refresh_token cookie set by /auth/login across the frontend's
  // different port (:3001 vs backend :6060) — see identity's context.md.
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3001').split(','),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 6060);
}
void bootstrap();
