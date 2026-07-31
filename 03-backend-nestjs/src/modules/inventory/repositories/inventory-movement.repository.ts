import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { InventoryMovement } from '../entities/inventory-movement.entity';

@Injectable()
export class InventoryMovementRepository {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly repo: Repository<InventoryMovement>,
  ) {}

  create(data: Partial<InventoryMovement>): InventoryMovement {
    return this.repo.create(data);
  }

  save(
    movement: InventoryMovement,
    manager?: EntityManager,
  ): Promise<InventoryMovement> {
    return this.scopedRepo(manager).save(movement);
  }

  private scopedRepo(manager?: EntityManager): Repository<InventoryMovement> {
    return manager ? manager.getRepository(InventoryMovement) : this.repo;
  }
}
