import { ApiProperty } from '@nestjs/swagger';

export class CreateMaintenanceRequestDto {
  @ApiProperty({ example: 'room-b204', description: 'The ID of the room this request is about' })
  roomId: string;

  @ApiProperty({ example: 'Electrical', description: 'Category of the maintenance issue' })
  category: string;

  @ApiProperty({ example: 'Broken ceiling fan', description: 'Short title describing the issue' })
  title: string;

  @ApiProperty({
    example: 'The ceiling fan makes a loud noise and barely spins.',
    description: 'Full description of the issue',
  })
  description: string;

  @ApiProperty({
    example: 'Medium',
    description: 'Priority level',
    enum: ['Low', 'Medium', 'High'],
  })
  priority: 'Low' | 'Medium' | 'High';
}
