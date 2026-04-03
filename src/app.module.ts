import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UrlsModule } from './urls/urls.module';
import { ClicksModule } from './clicks/clicks.module';
import { StatsModule } from './stats/stats.module';
import { CacheModule } from './cache/cache.module';
import { RedirectController } from './redirect.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: configService.get('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false, // Use migrations
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UrlsModule,
    ClicksModule,
    StatsModule,
    CacheModule,
  ],
  controllers: [AppController, RedirectController],
  providers: [AppService],
})
export class AppModule {}
