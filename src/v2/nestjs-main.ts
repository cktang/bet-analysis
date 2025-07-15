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
  console.log('📊 Modules: Data Collection, Processing, Analysis, Live Trading, Factor Drilling');
  console.log('🔧 Configuration loaded from config/live-betting.json');
  
  const port = process.env.PORT || 3001;
  console.log(`🔍 About to listen on port ${port}...`);
  await app.listen(port);
  console.log(`🎯 System running on http://localhost:${port}`);
  console.log(`🔍 Factor Drilling App: http://localhost:${port}/drill`);
}

bootstrap().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});