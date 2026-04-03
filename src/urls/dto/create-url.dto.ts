import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUrlDto {
  @ApiProperty({ example: 'https://example.com/very/long/path?with=params' })
  @IsUrl()
  originalUrl: string;

  @ApiPropertyOptional({ example: 'my-link' })
  @IsOptional()
  @IsString()
  alias?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}