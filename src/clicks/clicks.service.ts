import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as geoip from 'geoip-lite';
import { Click } from './entities/click.entity';
import { Url } from '../urls/entities/url.entity';

@Injectable()
export class ClicksService {
  constructor(
    @InjectRepository(Click)
    private clickRepository: Repository<Click>,
    @InjectRepository(Url)
    private urlRepository: Repository<Url>,
  ) {}

  async recordClick(shortCode: string, req: any): Promise<void> {
    const url = await this.urlRepository.findOne({ where: { shortCode } });
    if (!url) return;

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const geo = geoip.lookup(ip);

    const click = this.clickRepository.create({
      urlId: url.id,
      ip,
      country: geo?.country,
      city: geo?.city,
      browser: this.parseUserAgent(req.headers['user-agent'])?.browser,
      os: this.parseUserAgent(req.headers['user-agent'])?.os,
      referrer: req.headers.referer || null,
    });

    await this.clickRepository.save(click);
  }

  private parseUserAgent(userAgent: string): { browser: string; os: string } | null {
    if (!userAgent) return null;

    // Simple parsing, in real app use a library like ua-parser-js
    const browser = userAgent.includes('Chrome') ? 'Chrome' :
                    userAgent.includes('Firefox') ? 'Firefox' :
                    userAgent.includes('Safari') ? 'Safari' : 'Other';

    const os = userAgent.includes('Windows') ? 'Windows' :
               userAgent.includes('Mac') ? 'MacOS' :
               userAgent.includes('Linux') ? 'Linux' : 'Other';

    return { browser, os };
  }
}