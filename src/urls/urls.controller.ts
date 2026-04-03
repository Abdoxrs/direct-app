import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req, Redirect } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UrlsService } from './urls.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUrlDto } from './dto/create-url.dto';

@ApiTags('urls')
@Controller('urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Shorten a URL' })
  @ApiResponse({ status: 201, description: 'URL shortened successfully' })
  async createUrl(@Body() createUrlDto: CreateUrlDto, @Req() req) {
    const userId = req.user.userId;
    return this.urlsService.createUrl(createUrlDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user URLs' })
  @ApiResponse({ status: 200, description: 'List of user URLs' })
  async getUserUrls(@Req() req) {
    const userId = req.user.userId;
    return this.urlsService.getUserUrls(userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a URL' })
  @ApiResponse({ status: 204, description: 'URL deleted' })
  async deleteUrl(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    await this.urlsService.deleteUrl(id, userId);
  }
}

@Controller()
export class RedirectController {
  constructor(private readonly urlsService: UrlsService) {}

  @Get(':code')
  @ApiOperation({ summary: 'Redirect to original URL' })
  @ApiResponse({ status: 301, description: 'Redirect to original URL' })
  @Redirect()
  async redirect(@Param('code') code: string, @Req() req) {
    const originalUrl = await this.urlsService.redirect(code, req);
    return { url: originalUrl, statusCode: 301 };
  }
}