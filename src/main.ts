import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { registerWithConsul } from './consul-registration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('operations');   // ← add this line

  const config = new DocumentBuilder()
    .setTitle('Operations Service API')
    .setDescription('Maintenance, Visitors and Notices for the Another Home platform')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4002;
  await app.listen(port);
  registerWithConsul('operations', port);
}
bootstrap();
