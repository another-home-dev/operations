import { ApiProperty } from '@nestjs/swagger';

export class UpdateNoticeDto {
  @ApiProperty({ example: 'Water supply interruption on Sept 2nd', required: false })
  title?: string;

  @ApiProperty({ example: 'Water will be unavailable from 9 AM to 2 PM.', required: false })
  content?: string;
}