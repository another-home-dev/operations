import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  INoticeRepository,
  FindAllNoticeParams,
  FindAllNoticeResult,
} from '../../../domain/ports/notice.repository.interface';
import { Notice } from '../../../domain/entities/Notice.entity';
import { NoticeOrmEntity } from '../entities/notice.orm-entity';
import { NoticeMapper } from '../mappers/notice.mapper';

@Injectable()
export class NoticeRepository implements INoticeRepository {
  constructor(
    @InjectRepository(NoticeOrmEntity)
    private readonly typeOrmRepository: Repository<NoticeOrmEntity>,
  ) {}

  async save(notice: Notice): Promise<Notice> {
    const ormEntity = NoticeMapper.toPersistence(notice);
    const savedEntity = await this.typeOrmRepository.save(ormEntity);
    return NoticeMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Notice | null> {
    const entity = await this.typeOrmRepository.findOne({ where: { id } });
    return entity ? NoticeMapper.toDomain(entity) : null;
  }

  async findAll(params: FindAllNoticeParams): Promise<FindAllNoticeResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;

    const [entities, totalRecords] = await this.typeOrmRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { publishedDate: 'DESC' },
    });

    return {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalRecords / pageSize)),
      totalRecords,
      pageSize,
      data: entities.map((entity) => NoticeMapper.toDomain(entity)),
    };
  }

  async remove(id: string): Promise<void> {
    await this.typeOrmRepository.softDelete(id);
  }
}
