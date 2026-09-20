import { ApiProperty } from '@nestjs/swagger';

export class UpdateVisitorStatusDto {
  @ApiProperty({
    example: 'Approved',
    description: 'New status for this visitor request',
    enum: ['Approved', 'Rejected'],
  })
  status: 'Approved' | 'Rejected';
}
