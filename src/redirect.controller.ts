import { Controller, Get, Param, Redirect, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UrlsService } from './urls/urls.service';

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