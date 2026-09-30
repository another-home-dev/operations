import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceModule } from './maintanence/maintenance.module';
import { VisitorsModule } from './visitors/visitor.module';
import { NoticesModule } from './notices/notice.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_DATABASE ?? 'operations_service',
      autoLoadEntities: true,
      synchronize: true, // Dev-only — replace with real migrations later.
      // Default mysql2 pool is 10; raised to handle bursts of concurrent
      // students. 4 services share one MySQL instance (max_connections: 151
      // default), so 25 each (100 total) leaves headroom for the rest.
      extra: { connectionLimit: 25 },
    }),
    MaintenanceModule,
    VisitorsModule,
    NoticesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
