import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IMaintenanceRepository,
  FindAllParams,
  FindAllResult,
  MaintenanceStats,
} from '../../../domain/ports/maintenance.repository.interface';
import { MaintenanceRequest } from '../../../domain/entities/MaintenanceRequest.entity';
import { MaintenanceRequestOrmEntity } from '../entities/maintenance-request.orm-entity';
import { MaintenanceRequestMapper } from '../mappers/maintenance-request.mapper';

@Injectable()
export class MaintenanceRepository implements IMaintenanceRepository {
  constructor(
    // We inject the actual TypeORM repository for the ORM Entity
    @InjectRepository(MaintenanceRequestOrmEntity)
    private readonly typeOrmRepository: Repository<MaintenanceRequestOrmEntity>,
  ) {}

  async save(request: MaintenanceRequest): Promise<MaintenanceRequest> {
    // 1. Convert pure Domain object to Database Entity
    const ormEntity = MaintenanceRequestMapper.toPersistence(request);

    // 2. Save it using TypeORM
    const savedEntity = await this.typeOrmRepository.save(ormEntity);

    // 3. Convert it back to a pure Domain object to return
    return MaintenanceRequestMapper.toDomain(savedEntity);
  }

  async saveImage(id: string, imageData: string): Promise<void> {
    await this.typeOrmRepository.update({ id }, { imageData, hasImage: true });
  }

  async findImage(id: string): Promise<string | null> {
    const row = await this.typeOrmRepository.findOne({ where: { id }, select: { id: true, imageData: true } });
    return row?.imageData ?? null;
  }

  async findById(id: string): Promise<MaintenanceRequest | null> {
    const ormEntity = await this.typeOrmRepository.findOne({ where: { id } });
    if (!ormEntity) return null;

    return MaintenanceRequestMapper.toDomain(ormEntity);
  }

  async findAll(params: FindAllParams): Promise<FindAllResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;

    const where: Record<string, string> = {};
    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;
    if (params.category) where.category = params.category;
    if (params.studentId) where.studentId = params.studentId;

    const [entities, totalRecords] = await this.typeOrmRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { submittedDate: 'DESC' },
    });

    return {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalRecords / pageSize)),
      totalRecords,
      pageSize,
      data: entities.map((entity) => MaintenanceRequestMapper.toDomain(entity)),
    };
  }

  async findStats(): Promise<MaintenanceStats> {
    const [total, pending, inProgress, resolved] = await Promise.all([
      this.typeOrmRepository.count(),
      this.typeOrmRepository.count({ where: { status: 'Pending' } }),
      this.typeOrmRepository.count({ where: { status: 'In Progress' } }),
      this.typeOrmRepository.count({ where: { status: 'Resolved' } }),
    ]);

    return { total, pending, inProgress, resolved };
  }
}
