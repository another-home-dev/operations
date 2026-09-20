import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitorController } from './infrastructure/controller/visitor.controller';
import { VisitorService } from './visitor.service';
import { VisitorRepository } from './infrastructure/database/repositories/visitor.repository';
import { VisitorRequestOrmEntity } from './infrastructure/database/entities/visitor-request.orm-entity';
import { VISITOR_REPOSITORY } from './domain/ports/visitor.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([VisitorRequestOrmEntity])],
  controllers: [VisitorController],
  providers: [
    VisitorService,
    { provide: VISITOR_REPOSITORY, useClass: VisitorRepository },
  ],
})
export class VisitorsModule {}
