import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';

@Injectable()
export class OwnerDashboardGuard implements CanActivate {
  constructor(
    @InjectModel(Personnel.name)
    private readonly personnelModel: Model<PersonnelDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Check for dashboard token in headers
    const token = request.headers['x-dashboard-token'] || request.query.token;
    
    if (!token) {
      throw new UnauthorizedException('Dashboard token is required');
    }

    const person = await this.personnelModel.findOne({
      dashboardToken: token,
      dashboardTokenExpiresAt: { $gt: new Date() },
      deletedAt: { $exists: false }
    });

    if (!person) {
      throw new UnauthorizedException('Invalid or expired dashboard token');
    }

    // Attach owner to request
    request.user = person;
    request.userRole = 'owner';
    
    return true;
  }
}
