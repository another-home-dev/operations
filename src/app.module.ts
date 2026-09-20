import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceModule } from './maintanence/maintenance.module';
import { VisitorsModule } from './visitors/visitor.module';
import { NoticesModule } from './notices/notice.module';

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
    }),
    MaintenanceModule,
    VisitorsModule,
    NoticesModule,
  ],
})
export class AppModule {}
