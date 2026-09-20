import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { NoticeService } from '../../notice.service';
import { CreateNoticeDto } from '../dto/create-notice.dto';
import { UpdateNoticeDto } from '../dto/update-notice.dto';
import { IdentityGuard } from '../../../common/guards/identity.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Notices')
@ApiHeader({ name: 'x-user-id', description: 'Authenticated user ID (normally injected by the Gateway)', required: true })
@ApiHeader({ name: 'x-user-roles', description: 'Comma-separated roles, e.g. "student" or "warden"', required: true })
@UseGuards(IdentityGuard)
@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Post()
  @ApiOperation({ summary: 'Publish a new notice (warden only)' })
  @ApiResponse({ status: 201, description: 'Notice published successfully.' })
  createNotice(
    @Body() dto: CreateNoticeDto,
    @CurrentUser() user: { userId: string; roles: string[] },
  ) {
    return this.noticeService.createNotice(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of published notices' })
  @ApiResponse({ status: 200, description: 'Returns one page of notices.' })
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.noticeService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Patch(':id')
  updateNotice(
    @Param('id') id: string,
    @Body() dto: UpdateNoticeDto,
    @CurrentUser() user: { userId: string; roles: string[] },
  ) {
    return this.noticeService.updateNotice(id, dto, user);
  }

  @Delete(':id')
  removeNotice(@Param('id') id: string, @CurrentUser() user: { userId: string; roles: string[] }) {
    return this.noticeService.removeNotice(id, user);
  }
}
