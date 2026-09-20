import { ApiProperty } from '@nestjs/swagger';

export class CreateVisitorRequestDto {
  @ApiProperty({ example: 'room-b204', description: 'The ID of the room being visited' })
  roomId: string;

  @ApiProperty({ example: 'Mahesh Perera', description: 'Name of the visitor' })
  visitorName: string;

  @ApiProperty({ example: '+94 71 234 5678', description: 'Contact number of the visitor' })
  visitorContact: string;

  @ApiProperty({ example: 'Family visit', description: 'Reason for the visit' })
  purpose: string;

  @ApiProperty({ example: '2026-09-01', description: 'Requested visit date' })
  visitDate: string;

  @ApiProperty({ example: '2:00 PM', description: 'Requested visit time' })
  visitTime: string;
}
