import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  redirectToFactorDrilling(@Res() res: Response) {
    res.redirect('/analysis/drill-app');
  }

  @Get('health')
  healthCheck() {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'Factor Drilling System' 
    };
  }
}