import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MAINTENANCE_REPOSITORY } from './domain/ports/maintenance.repository.interface';
import type { IMaintenanceRepository, FindAllParams } from './domain/ports/maintenance.repository.interface';
import { MaintenanceRequest } from './domain/entities/MaintenanceRequest.entity';
import { CreateMaintenanceRequestDto } from './infrastructure/dto/create-maintenance-request.dto';
import { UpdateMaintenanceStatusDto } from './infrastructure/dto/update-maintenance-status.dto';

interface CurrentUser {
  userId: string;
  roles: string[];
}

@Injectable()
export class MaintenanceService {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: IMaintenanceRepository,
  ) {}

  async createRequest(dto: CreateMaintenanceRequestDto, currentUser: CurrentUser): Promise<MaintenanceRequest> {
    // studentId comes from the authenticated identity (the wristband), never
    // from the request body — this is what stops someone filing a complaint
    // "as" another student.
    const request = new MaintenanceRequest(
      randomUUID(),
      currentUser.userId,
      dto.roomId,
      dto.category,
      dto.title,
      dto.description,
      dto.priority,
      'Pending',
      null,
      new Date(),
    );

    return this.maintenanceRepository.save(request);
  }

  async findAll(params: FindAllParams) {
    return this.maintenanceRepository.findAll(params);
  }

  async getStats() {
    return this.maintenanceRepository.findStats();
  }

  async updateStatus(id: string, dto: UpdateMaintenanceStatusDto, currentUser: CurrentUser): Promise<MaintenanceRequest> {
    const request = await this.maintenanceRepository.findById(id);
    if (!request) {
      throw new NotFoundException(`Maintenance request ${id} not found`);
    }

    const isWarden = currentUser.roles.includes('warden');
    const isOwner = request.studentId === currentUser.userId;

    // Role check: wardens can act on anything.
    // Ownership check: a non-warden may only act on their OWN request.
    if (!isWarden && !isOwner) {
      throw new ForbiddenException('You are not allowed to modify this maintenance request.');
    }

    // Same fix as Visitors: the domain's own rules throw a plain Error,
    // which NestJS would otherwise turn into an unhelpful 500. Catching it
    // here converts it into a clean 400 with the real message.
    try {
      if (dto.assignedStaff) {
        request.assignStaff(dto.assignedStaff);
      }

      if (dto.status === 'Resolved') {
        request.markAsResolved();
      } else {
        request.status = dto.status;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    return this.maintenanceRepository.save(request);
  }
}
