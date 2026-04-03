import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClicksService } from './clicks.service';
import { Click } from './entities/click.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Click])],
  providers: [ClicksService],
  exports: [ClicksService],
})
export class ClicksModule {}