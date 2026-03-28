import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AgenciesModule } from './agencies/agencies.module';
import { AuthModule } from './auth/auth.module';
import { LeadsModule } from './leads/leads.module';
import { PersonnelModule } from './personnel/personnel.module';
import { PropertiesModule } from './properties/properties.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    // Load .env first
    ConfigModule.forRoot({ isGlobal: true }),

    // Connect to MongoDB
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/rental-agency'),

    // Feature modules
    AuthModule,
    AgenciesModule,
    LeadsModule,
    PersonnelModule,
    PropertiesModule,
    WebhooksModule,
  ],
})
export class AppModule {}
