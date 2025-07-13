import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DashboardController } from './dashboard.controller';
import { ApiController } from './api.controller';
import { V2DataController } from './v2-data.controller';
import { CoreModule } from '../core/core.module';
import { LiveTradingModule } from '../live-trading';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'public'),
      serveRoot: '/dashboard',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'node_modules'),
      serveRoot: '/node_modules',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', '..', 'data'),
      serveRoot: '/data',
    }),
    CoreModule,
    LiveTradingModule.register(), // 🎯 FIX: Use register() method for dynamic module
  ],
  controllers: [DashboardController, ApiController, V2DataController],
})
export class WebInterfaceModule {}