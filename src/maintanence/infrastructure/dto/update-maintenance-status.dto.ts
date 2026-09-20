import { ApiProperty } from '@nestjs/swagger';

export class UpdateMaintenanceStatusDto {
  @ApiProperty({
    example: 'Resolved',
    description: 'New status for this request',
    enum: ['Pending', 'In Progress', 'Resolved'],
  })
  status: 'Pending' | 'In Progress' | 'Resolved';

  @ApiProperty({
    example: 'Mr. Sunil Bandara',
    description: 'Staff member assigned to this request',
    required: false,
  })
  assignedStaff?: string;
}
