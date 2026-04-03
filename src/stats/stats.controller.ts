import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get(':code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics for a URL' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getStats(@Param('code') code: string, @Req() req) {
    const userId = req.user.userId;
    return this.statsService.getStats(code, userId);
  }
}