import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AgencyGuard implements CanActivate {
  constructor(
    @InjectModel(RentalAgency.name)
    private readonly agencyModel: Model<RentalAgencyDocument>,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
     const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JwtAuthGuard

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const agencyId = request.headers['x-agency-id'];

    if (!agencyId) {
      throw new ForbiddenException('X-Agency-ID header is required for this action');
    }

    const agency = await this.agencyModel.findById(agencyId);
    if (!agency) {
      throw new ForbiddenException('Invalid Agency ID');
    }

    // Check if the authenticated person is staff or owner of this agency
    const isOwner = agency.ownerId.toString() === user._id.toString();
    const staffMember = agency.staff.find(
      (s) => s.personnelId.toString() === user._id.toString(),
    );

    if (!isOwner && !staffMember) {
      throw new ForbiddenException('You do not have access to this agency');
    }

    // Attach agency context to the request
    request.agency = agency;
    request.agencyId = agency._id;
    request.userRole = isOwner ? 'owner' : staffMember?.role;

    return true;
  }
}
