import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { CacheService } from './cache/cache.service';

@Injectable()
export class AppService {
  constructor(
    @InjectConnection()
    private connection: Connection,
    private cacheService: CacheService,
  ) {}

  getHello(): string {
    return 'SnapURL API is running!';
  }

  async getHealth() {
    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();
    const status = dbStatus && redisStatus ? 'ok' : 'error';

    return {
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus ? 'up' : 'down',
        redis: redisStatus ? 'up' : 'down',
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.connection.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      await this.cacheService.get('health-check');
      return true;
    } catch {
      return false;
    }
  }
}
