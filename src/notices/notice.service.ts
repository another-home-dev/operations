import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NOTICE_REPOSITORY } from './domain/ports/notice.repository.interface';
import type { INoticeRepository, FindAllNoticeParams } from './domain/ports/notice.repository.interface';
import { Notice } from './domain/entities/Notice.entity';
import { CreateNoticeDto } from './infrastructure/dto/create-notice.dto';
import { UpdateNoticeDto } from './infrastructure/dto/update-notice.dto';

interface CurrentUser {
  userId: string;
  roles: string[];
}

@Injectable()
export class NoticeService {
  constructor(
    @Inject(NOTICE_REPOSITORY)
    private readonly noticeRepository: INoticeRepository,
  ) {}

  async createNotice(dto: CreateNoticeDto, currentUser: CurrentUser): Promise<Notice> {
    // Role check only, same reasoning as Visitors: publishing a notice is a
    // warden action. There's no ownership case here at all — a notice never
    // belongs to a student, so there's nothing for a student to "own."
    if (!currentUser.roles.includes('warden')) {
      throw new ForbiddenException('Only a warden can publish notices.');
    }

    const notice = new Notice(randomUUID(), currentUser.userId, dto.title, dto.content, new Date());
    return this.noticeRepository.save(notice);
  }

  async findAll(params: FindAllNoticeParams) {
    // No role check here — every authenticated user (student or warden)
    // is allowed to read published notices, only publishing is restricted.
    return this.noticeRepository.findAll(params);
  }

  async updateNotice(id: string, dto: UpdateNoticeDto, currentUser: CurrentUser): Promise<Notice> {
    this.assertWarden(currentUser);
    const notice = await this.noticeRepository.findById(id);
    if (!notice) throw new NotFoundException(`Notice ${id} not found`);
    if (dto.title !== undefined) notice.title = dto.title;
    if (dto.content !== undefined) notice.content = dto.content;
    return this.noticeRepository.save(notice);
  }

  async removeNotice(id: string, currentUser: CurrentUser): Promise<{ success: true }> {
    this.assertWarden(currentUser);
    const notice = await this.noticeRepository.findById(id);
    if (!notice) throw new NotFoundException(`Notice ${id} not found`);
    await this.noticeRepository.remove(id);
    return { success: true };
  }

  private assertWarden(currentUser: CurrentUser): void {
    if (!currentUser.roles.includes('warden')) {
      throw new ForbiddenException('Only a warden can manage notices.');
    }
  }
}
