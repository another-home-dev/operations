import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceController } from './infrastructure/controller/maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceRepository } from './infrastructure/database/repositories/maintenance.repository';
import { MaintenanceRequestOrmEntity } from './infrastructure/database/entities/maintenance-request.orm-entity';
import { MAINTENANCE_REPOSITORY } from './domain/ports/maintenance.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceRequestOrmEntity])],
  controllers: [MaintenanceController],
  providers: [
    MaintenanceService,
    { provide: MAINTENANCE_REPOSITORY, useClass: MaintenanceRepository },
  ],
})
export class MaintenanceModule {}
