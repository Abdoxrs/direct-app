import { Injectable, NotFoundException, GoneException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Url } from './entities/url.entity';
import { CacheService } from '../cache/cache.service';
import { ClicksService } from '../clicks/clicks.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UrlsService {
  constructor(
    @InjectRepository(Url)
    private urlRepository: Repository<Url>,
    private cacheService: CacheService,
    private clicksService: ClicksService,
    private configService: ConfigService,
  ) {}

  private generateCode(length = 7): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async createUrl(createUrlDto: CreateUrlDto, userId: string): Promise<any> {
    const { originalUrl, alias, expiresAt } = createUrlDto;

    let shortCode = alias;
    if (!shortCode) {
      shortCode = this.generateCode();
      // Ensure unique
      while (await this.urlRepository.findOne({ where: { shortCode } })) {
        shortCode = this.generateCode();
      }
    } else {
      const existing = await this.urlRepository.findOne({ where: { shortCode } });
      if (existing) {
        throw new BadRequestException('Alias already taken');
      }
    }

    const url = this.urlRepository.create({
      shortCode,
      originalUrl,
      userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    const savedUrl = await this.urlRepository.save(url);

    const baseUrl = this.configService.get('BASE_URL');
    return {
      id: savedUrl.id,
      shortCode: savedUrl.shortCode,
      shortUrl: `${baseUrl}/${savedUrl.shortCode}`,
      originalUrl: savedUrl.originalUrl,
      expiresAt: savedUrl.expiresAt,
      createdAt: savedUrl.createdAt,
    };
  }

  async redirect(shortCode: string, req: any): Promise<string> {
    const cacheKey = `snapurl:${shortCode}`;
    let originalUrl = await this.cacheService.get(cacheKey);

    if (!originalUrl) {
      const url = await this.urlRepository.findOne({ where: { shortCode } });
      if (!url) {
        throw new NotFoundException('URL not found');
      }
      if (url.expiresAt && new Date() > url.expiresAt) {
        throw new GoneException('URL expired');
      }
      originalUrl = url.originalUrl;
      const ttl = this.configService.get('REDIS_TTL', 3600);
      await this.cacheService.set(cacheKey, originalUrl, ttl);
    }

    // Record click
    await this.clicksService.recordClick(shortCode, req);

    return originalUrl;
  }

  async getUserUrls(userId: string): Promise<any[]> {
    const urls = await this.urlRepository.find({
      where: { userId },
      relations: ['clicks'],
    });
    return urls.map(url => ({
      id: url.id,
      shortCode: url.shortCode,
      shortUrl: `${this.configService.get('BASE_URL')}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      totalClicks: url.clicks.length,
      expiresAt: url.expiresAt,
      createdAt: url.createdAt,
    }));
  }

  async deleteUrl(id: string, userId: string): Promise<void> {
    const url = await this.urlRepository.findOne({ where: { id, userId } });
    if (!url) {
      throw new NotFoundException('URL not found');
    }
    await this.urlRepository.remove(url);
    // Invalidate cache
    await this.cacheService.del(`snapurl:${url.shortCode}`);
  }
}