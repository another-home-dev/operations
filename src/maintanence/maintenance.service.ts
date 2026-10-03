import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MAINTENANCE_REPOSITORY } from './domain/ports/maintenance.repository.interface';
import type { IMaintenanceRepository, FindAllParams } from './domain/ports/maintenance.repository.interface';
import { MaintenanceRequest } from './domain/entities/MaintenanceRequest.entity';
import { CreateMaintenanceRequestDto } from './infrastructure/dto/create-maintenance-request.dto';
import { UpdateMaintenanceStatusDto } from './infrastructure/dto/update-maintenance-status.dto';
import { notifyUser } from '../common/notification-client';

interface CurrentUser {
  userId: string;
  roles: string[];
}

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const MAX_IMAGE_CHARS = 4_000_000; // ~3 MB decoded
const STAFF_ROLES = ['warden', 'staff', 'super-admin'];

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
    if (dto.imageData && (dto.imageData.length > MAX_IMAGE_CHARS || !IMAGE_DATA_URL.test(dto.imageData))) {
      throw new BadRequestException('imageData must be a JPEG, PNG or WebP base64 data URL no larger than ~3 MB.');
    }

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
      !!dto.imageData,
    );

    const saved = await this.maintenanceRepository.save(request);
    if (dto.imageData) {
      await this.maintenanceRepository.saveImage(saved.id, dto.imageData);
    }
    return saved;
  }

  async getImage(id: string, currentUser: CurrentUser): Promise<string> {
    const request = await this.maintenanceRepository.findById(id);
    if (!request) {
      throw new NotFoundException(`Maintenance request ${id} not found`);
    }

    const isStaff = currentUser.roles.some((role) => STAFF_ROLES.includes(role));
    if (!isStaff && request.studentId !== currentUser.userId) {
      throw new ForbiddenException('You are not allowed to view this maintenance request.');
    }

    const imageData = request.hasImage ? await this.maintenanceRepository.findImage(id) : null;
    if (!imageData) {
      throw new NotFoundException('This maintenance request has no image.');
    }
    return imageData;
  }

  async findAll(params: FindAllParams, currentUser?: CurrentUser) {
    // Staff see everything (and may filter by studentId). Anyone else only ever
    // sees their own requests: requests are stored under the caller's identity
    // (the Asgardeo sub in x-user-id), so a client-supplied studentId — e.g. the
    // accommodation Student.id, a different UUID — would never match anyway.
    const isStaff = currentUser?.roles.some((role) => STAFF_ROLES.includes(role)) ?? false;
    if (currentUser && !isStaff) {
      return this.maintenanceRepository.findAll({ ...params, studentId: currentUser.userId });
    }
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
      } else if (dto.status) {
        // Only overwrite status when the caller actually sent one — a
        // request that only sends assignedStaff (see above) must keep the
        // "In Progress" status that assignStaff() just set, not have it
        // wiped to undefined by an absent dto.status.
        request.status = dto.status;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    const saved = await this.maintenanceRepository.save(request);

    if (saved.status === 'Resolved') {
      void notifyUser(saved.studentId, 'Maintenance request resolved', `Your request "${saved.title}" has been resolved.`);
    }

    return saved;
  }
}
