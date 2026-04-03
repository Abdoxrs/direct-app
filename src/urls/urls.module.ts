import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrlsController } from './urls.controller';
import { UrlsService } from './urls.service';
import { UrlsRepository } from './urls.repository';
import { Url } from './entities/url.entity';
import { CacheModule } from '../cache/cache.module';
import { ClicksModule } from '../clicks/clicks.module';

@Module({
  imports: [TypeOrmModule.forFeature([Url]), CacheModule, ClicksModule],
  controllers: [UrlsController],
  providers: [UrlsService, UrlsRepository],
  exports: [UrlsService],
})
export class UrlsModule {}