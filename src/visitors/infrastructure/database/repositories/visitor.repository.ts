import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IVisitorRepository,
  FindAllVisitorParams,
  FindAllVisitorResult,
} from '../../../domain/ports/visitor.repository.interface';
import { VisitorRequest } from '../../../domain/entities/VisitorRequest.entity';
import { VisitorRequestOrmEntity } from '../entities/visitor-request.orm-entity';
import { VisitorRequestMapper } from '../mappers/visitor-request.mapper';

@Injectable()
export class VisitorRepository implements IVisitorRepository {
  constructor(
    @InjectRepository(VisitorRequestOrmEntity)
    private readonly typeOrmRepository: Repository<VisitorRequestOrmEntity>,
  ) {}

  async save(request: VisitorRequest): Promise<VisitorRequest> {
    const ormEntity = VisitorRequestMapper.toPersistence(request);
    const savedEntity = await this.typeOrmRepository.save(ormEntity);
    return VisitorRequestMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<VisitorRequest | null> {
    const ormEntity = await this.typeOrmRepository.findOne({ where: { id } });
    if (!ormEntity) return null;

    return VisitorRequestMapper.toDomain(ormEntity);
  }

  async findAll(params: FindAllVisitorParams): Promise<FindAllVisitorResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;

    const where: Record<string, string> = {};
    if (params.status) where.status = params.status;

    const [entities, totalRecords] = await this.typeOrmRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { visitDate: 'DESC' },
    });

    return {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalRecords / pageSize)),
      totalRecords,
      pageSize,
      data: entities.map((entity) => VisitorRequestMapper.toDomain(entity)),
    };
  }
}
