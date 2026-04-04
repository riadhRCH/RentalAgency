import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getStatus() {
    const port = process.env.PORT || '3000';
    const appUrl = process.env.APP_URL || `http://localhost:${port}`;

    return {
      name: 'Rental Agency Backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      appUrl,
      port,
      cors: {
        origin: '*',
        note: 'CORS is configured to accept traffic from any origin.',
      },
      endpoints: {
        auth: '/auth',
        agencies: '/agencies',
        leads: '/leads',
        personnel: '/personnel',
        properties: '/properties',
        rentals: '/rentals',
        visits: '/visits',
        webhooks: '/webhooks',
      },
    };
  }
}
