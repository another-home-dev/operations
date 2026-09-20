import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeController } from './infrastructure/controller/notice.controller';
import { NoticeService } from './notice.service';
import { NoticeRepository } from './infrastructure/database/repositories/notice.repository';
import { NoticeOrmEntity } from './infrastructure/database/entities/notice.orm-entity';
import { NOTICE_REPOSITORY } from './domain/ports/notice.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([NoticeOrmEntity])],
  controllers: [NoticeController],
  providers: [
    NoticeService,
    { provide: NOTICE_REPOSITORY, useClass: NoticeRepository },
  ],
})
export class NoticesModule {}
