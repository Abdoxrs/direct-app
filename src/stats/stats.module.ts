import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Click } from '../clicks/entities/click.entity';
import { Url } from '../urls/entities/url.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Click, Url])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}