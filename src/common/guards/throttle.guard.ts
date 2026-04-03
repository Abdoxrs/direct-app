import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { CacheService } from '../../cache/cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ThrottleGuard implements CanActivate {
  constructor(
    private cacheService: CacheService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) return true; // Allow if no user

    const key = `throttle:${userId}`;
    const ttl = this.configService.get('THROTTLE_TTL', 60);
    const limit = this.configService.get('THROTTLE_LIMIT', 20);

    const count = await this.cacheService.incr(key);
    if (count === 1) {
      await this.cacheService.expire(key, ttl);
    }
    if (count > limit) {
      throw new HttpException('Too many requests', 429);
    }
    return true;
  }
}