import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe());
  
  // Enable CORS for web interface
  app.enableCors();
  
  console.log('🚀 Live Betting System V2 - NestJS Starting...');
  console.log('📊 Modules: Data Collection, Processing, Analysis, Live Trading, Web Interface');
  console.log('🔧 Configuration loaded from config/live-betting.json');
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🎯 System running on http://localhost:${port}`);
}

bootstrap().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});