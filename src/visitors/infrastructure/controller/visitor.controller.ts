import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { VisitorService } from '../../visitor.service';
import { CreateVisitorRequestDto } from '../dto/create-visitor-request.dto';
import { UpdateVisitorStatusDto } from '../dto/update-visitor-status.dto';
import { IdentityGuard } from '../../../common/guards/identity.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Visitors')
@ApiHeader({ name: 'x-user-id', description: 'Authenticated user ID (normally injected by the Gateway)', required: true })
@ApiHeader({ name: 'x-user-roles', description: 'Comma-separated roles, e.g. "student" or "warden"', required: true })
@UseGuards(IdentityGuard)
@Controller('visitors')
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  @Post()
  @ApiOperation({ summary: 'Request a new visitor' })
  @ApiResponse({ status: 201, description: 'Visitor request created successfully.' })
  createRequest(
    @Body() dto: CreateVisitorRequestDto,
    @CurrentUser() user: { userId: string; roles: string[] },
  ) {
    return this.visitorService.createRequest(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated, filterable list of visitor requests' })
  @ApiResponse({ status: 200, description: 'Returns one page of visitor requests.' })
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: { userId: string; roles: string[] },
  ) {
    return this.visitorService.findAll(
      {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        status,
      },
      user,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Approve or reject a visitor request (warden only)' })
  @ApiResponse({ status: 200, description: 'Visitor request updated successfully.' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVisitorStatusDto,
    @CurrentUser() user: { userId: string; roles: string[] },
  ) {
    return this.visitorService.updateStatus(id, dto, user);
  }
}
