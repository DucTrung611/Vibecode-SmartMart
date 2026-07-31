import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuthSession } from '../entities/auth-session.entity';

@Injectable()
export class AuthSessionRepository {
  constructor(
    @InjectRepository(AuthSession)
    private readonly repo: Repository<AuthSession>,
  ) {}

  create(data: Partial<AuthSession>): AuthSession {
    return this.repo.create(data);
  }

  save(session: AuthSession, manager?: EntityManager): Promise<AuthSession> {
    return this.scopedRepo(manager).save(session);
  }

  // Locks the row so two concurrent refresh calls can't both see
  // "not revoked" and both rotate — required to make reuse-detection reliable.
  findByRefreshTokenHashForUpdate(
    refreshTokenHash: string,
    manager: EntityManager,
  ): Promise<AuthSession | null> {
    return manager
      .getRepository(AuthSession)
      .createQueryBuilder('session')
      .setLock('pessimistic_write')
      .where('session.refreshTokenHash = :refreshTokenHash', {
        refreshTokenHash,
      })
      .getOne();
  }

  revokeAllActiveForUser(
    userId: string,
    manager?: EntityManager,
  ): Promise<unknown> {
    return this.scopedRepo(manager)
      .createQueryBuilder()
      .update(AuthSession)
      .set({ revokedAt: () => 'now()' })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  private scopedRepo(manager?: EntityManager): Repository<AuthSession> {
    return manager ? manager.getRepository(AuthSession) : this.repo;
  }
}
