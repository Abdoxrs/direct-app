import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Click } from '../clicks/entities/click.entity';
import { Url } from '../urls/entities/url.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Click)
    private clickRepository: Repository<Click>,
    @InjectRepository(Url)
    private urlRepository: Repository<Url>,
  ) {}

  async getStats(shortCode: string, userId: string): Promise<any> {
    const url = await this.urlRepository.findOne({
      where: { shortCode, userId },
      relations: ['clicks'],
    });
    if (!url) {
      throw new NotFoundException('URL not found or not owned by user');
    }

    const clicks = url.clicks;
    const totalClicks = clicks.length;
    const uniqueIps = new Set(clicks.map(c => c.ip)).size;

    // Clicks by day
    const clicksByDay = this.groupByDay(clicks);

    // Top countries
    const topCountries = this.topItems(clicks, 'country');

    // Top referrers
    const topReferrers = this.topItems(clicks, 'referrer');

    // Browsers
    const browsers = this.countItems(clicks, 'browser');

    return {
      shortCode,
      originalUrl: url.originalUrl,
      totalClicks,
      uniqueIps,
      clicksByDay,
      topCountries,
      topReferrers,
      browsers,
    };
  }

  private groupByDay(clicks: Click[]): { date: string; count: number }[] {
    const map = new Map<string, number>();
    clicks.forEach(click => {
      const date = click.clickedAt.toISOString().split('T')[0];
      map.set(date, (map.get(date) || 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  }

  private topItems(clicks: Click[], field: keyof Click): { [key: string]: number }[] {
    const map = new Map<string, number>();
    clicks.forEach(click => {
      const value = click[field] as string;
      if (value) map.set(value, (map.get(value) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item, count]) => ({ [field]: item, count }));
  }

  private countItems(clicks: Click[], field: keyof Click): { [key: string]: number } {
    const map = new Map<string, number>();
    clicks.forEach(click => {
      const value = click[field] as string;
      if (value) map.set(value, (map.get(value) || 0) + 1);
    });
    return Object.fromEntries(map);
  }
}