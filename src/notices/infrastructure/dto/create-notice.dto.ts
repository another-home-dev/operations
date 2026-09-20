import { ApiProperty } from '@nestjs/swagger';

export class CreateNoticeDto {
  @ApiProperty({ example: 'Water supply interruption on Sept 2nd', description: 'Notice title' })
  title: string;

  @ApiProperty({
    example: 'Water will be unavailable from 9 AM to 2 PM for scheduled maintenance.',
    description: 'Full notice content',
  })
  content: string;
}
