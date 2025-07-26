import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS for web interface
  app.enableCors();
  
  // Serve static files from utils directory
  app.useStaticAssets(join(__dirname, 'utils'), {
    prefix: '/utils/',
  });
  
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