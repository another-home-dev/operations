import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { MaintenanceService } from '../../maintenance.service';
import { CreateMaintenanceRequestDto } from '../dto/create-maintenance-request.dto';
import { UpdateMaintenanceStatusDto } from '../dto/update-maintenance-status.dto';
import { IdentityGuard } from '../../../common/guards/identity.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Maintenance')
@ApiHeader({ name: 'x-user-id', description: 'Authenticated user ID (normally injected by the Gateway)', required: true })
@ApiHeader({ name: 'x-user-roles', description: 'Comma-separated roles, e.g. "student" or "warden"', required: true })
@UseGuards(IdentityGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'File a new maintenance request' })
  @ApiResponse({ status: 201, description: 'Request created successfully.' })
  createRequest(
    @Body() dto: CreateMaintenanceRequestDto,
    @CurrentUser() user: { userId: string; roles: string[] },
  ) {
    return this.maintenanceService.createRequest(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated, filterable list of maintenance requests' })
  @ApiResponse({ status: 200, description: 'Returns one page of maintenance requests.' })
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
  ) {
    return this.maintenanceService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status,
      priority,
      category,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get complaint counts by status' })
  @ApiResponse({ status: 200, description: 'Returns total/pending/inProgress/resolved counts.' })
  getStats() {
    return this.maintenanceService.getStats();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update the status (and optionally assigned staff) of a request' })
  @ApiResponse({ status: 200, description: 'Request updated successfully.' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceStatusDto,
    @CurrentUser() user: { userId: string; roles: string[] },
  ) {
    return this.maintenanceService.updateStatus(id, dto, user);
  }
}
