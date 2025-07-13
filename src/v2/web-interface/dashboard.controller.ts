import { Controller, Get, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';

@Controller()
export class DashboardController {
  
  @Get('/')
  root(@Res() res: Response) {
    res.redirect('/dashboard');
  }

  @Get('/dashboard')
  dashboard(@Res() res: Response) {
    // Serve simple v2 data dashboard
    const dashboardPath = path.join(__dirname, 'public', 'v2-dashboard.html');
    res.sendFile(dashboardPath);
  }


  @Get('/factor-drilling')
  factorDrilling(@Res() res: Response) {
    const drillingPath = path.join(__dirname, 'public', 'factor-drilling.html');
    res.sendFile(drillingPath);
  }

  @Get('/live-trading')
  liveTrading(@Res() res: Response) {
    const liveTradingPath = path.join(__dirname, 'public', 'live-trading.html');
    res.sendFile(liveTradingPath);
  }

  @Get('/odds-test')
  oddsTest(@Res() res: Response) {
    const oddsTestPath = path.join(__dirname, 'public', 'odds-test.html');
    res.sendFile(oddsTestPath);
  }

  @Get('/performance')
  performance(@Res() res: Response) {
    const performancePath = path.join(__dirname, 'public', 'performance.html');
    res.sendFile(performancePath);
  }

  @Get('/data-management')
  dataManagement(@Res() res: Response) {
    const dataPath = path.join(__dirname, 'public', 'data-management.html');
    res.sendFile(dataPath);
  }
}