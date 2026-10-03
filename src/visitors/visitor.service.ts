import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { VISITOR_REPOSITORY } from './domain/ports/visitor.repository.interface';
import type { IVisitorRepository, FindAllVisitorParams } from './domain/ports/visitor.repository.interface';
import { VisitorRequest } from './domain/entities/VisitorRequest.entity';
import { CreateVisitorRequestDto } from './infrastructure/dto/create-visitor-request.dto';
import { UpdateVisitorStatusDto } from './infrastructure/dto/update-visitor-status.dto';
import { notifyUser } from '../common/notification-client';

const STAFF_ROLES = ['warden', 'staff', 'super-admin'];

interface CurrentUser {
  userId: string;
  roles: string[];
}

@Injectable()
export class VisitorService {
  constructor(
    @Inject(VISITOR_REPOSITORY)
    private readonly visitorRepository: IVisitorRepository,
  ) {}

  async createRequest(dto: CreateVisitorRequestDto, currentUser: CurrentUser): Promise<VisitorRequest> {
    // studentId comes from the identity header, never the body — same reason
    // as Maintenance: a student shouldn't be able to file a visitor request
    // "as" someone else by typing a different id into the JSON.
    const request = new VisitorRequest(
      randomUUID(),
      currentUser.userId,
      dto.roomId,
      dto.visitorName,
      dto.visitorContact,
      dto.purpose,
      dto.visitDate,
      dto.visitTime,
      'Pending',
    );

    return this.visitorRepository.save(request);
  }

  async findAll(params: FindAllVisitorParams, currentUser?: CurrentUser) {
    // Wardens see every request; a student only ever sees their own (requests
    // are filed under the caller's x-user-id, see createRequest).
    if (currentUser && !STAFF_ROLES.some((role) => currentUser.roles.includes(role))) {
      return this.visitorRepository.findAll({ ...params, studentId: currentUser.userId });
    }
    return this.visitorRepository.findAll(params);
  }

  async updateStatus(id: string, dto: UpdateVisitorStatusDto, currentUser: CurrentUser): Promise<VisitorRequest> {
    const request = await this.visitorRepository.findById(id);
    if (!request) {
      throw new NotFoundException(`Visitor request ${id} not found`);
    }

    // Unlike Maintenance, this is a PURE role check with no ownership
    // fallback: approving or rejecting a visitor is a warden's decision,
    // never something the requesting student can do to their own request.
    if (!currentUser.roles.includes('warden')) {
      throw new ForbiddenException('Only a warden can approve or reject visitor requests.');
    }

    // The domain entity throws a plain Error for its own business rule
    // ("can't review twice") — NestJS has no idea what to do with a plain
    // Error, so it falls back to a generic 500. Catching it here and
    // re-throwing as BadRequestException turns it into a proper, clean
    // 400 response with the real message intact.
    try {
      if (dto.status === 'Approved') {
        request.approve();
      } else {
        request.reject();
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    const saved = await this.visitorRepository.save(request);

    void notifyUser(
      saved.studentId,
      `Visitor request ${saved.status.toLowerCase()}`,
      `Your visitor request for ${saved.visitorName} has been ${saved.status.toLowerCase()}.`,
    );

    return saved;
  }
}
