import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RentalAgency, RentalAgencyDocument } from '../schemas/rental-agency.schema';
import { Personnel, PersonnelDocument } from '../schemas/personnel.schema';
import { Property, PropertyDocument } from '../schemas/property.schema';
import { Announcement, AnnouncementDocument } from '../schemas/announcement.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(RentalAgency.name)
    private readonly agencyModel: Model<RentalAgencyDocument>,
    @InjectModel(Personnel.name)
    private readonly personnelModel: Model<PersonnelDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findAllAgencies() {
    const agencies = await this.agencyModel.find({}).populate('ownerId', 'phone firstName lastName email').lean();
    return agencies.map((a) => ({
      id: a._id.toString(),
      name: a.name,
      owner: a.ownerId ? {
        id: (a.ownerId as any)._id?.toString(),
        phone: (a.ownerId as any).phone,
        firstName: (a.ownerId as any).firstName,
        lastName: (a.ownerId as any).lastName,
      } : null,
      staffCount: a.staff?.length || 0,
      services: a.services || [],
      createdAt: (a as any).createdAt,
    }));
  }

  async removeAgency(agencyId: string, deleteProperties: boolean, deletePersonnel: boolean) {
    //this api is not deleting agency, neither properties, neither personnel accounts
    /**
     * tryed Request URL
http://localhost:3000/admin/agencies/69fa41f4f90cd0687eeb33e9?deleteProperties=true&deletePersonnel=true
{
    "message": "Agency deleted successfully"
}
    but i still see the agency with id 69fa41f4f90cd0687eeb33e9, it is not
     */
    const agency = await this.agencyModel.findById(agencyId);
    if (!agency) throw new NotFoundException('Agency not found');

    if (deleteProperties) {
      const properties = await this.propertyModel.find({
        agencyId: new Types.ObjectId(agencyId),
      });

      for (const property of properties) {
        const announcements = await this.announcementModel.find({
          propertyId: property._id,
        });

        for (const announcement of announcements) {
          await this.cloudinaryService.deleteFilesFromUrls(announcement.photos ?? []);
          await this.announcementModel.deleteOne({ _id: announcement._id });
        }

        await this.cloudinaryService.deleteFilesFromUrls(property.photos ?? []);
        await this.cloudinaryService.deleteFilesFromUrls(property.videos ?? [], 'video');

        await this.propertyModel.deleteOne({ _id: property._id });
      }
    }

    if (deletePersonnel) {
      const allStaffIds = [
        agency.ownerId.toString(),
        ...agency.staff.map((s) => s.personnelId.toString()),
      ];
      const uniqueIds = [...new Set(allStaffIds)];

      for (const personnelId of uniqueIds) {
        const person = await this.personnelModel.findOneAndDelete({
          _id: new Types.ObjectId(personnelId),
        });
        if (person?.value?.profilePicture) {
          await this.cloudinaryService.deleteFilesFromUrls([person.value.profilePicture]);
        }
      }
    }

    await this.cloudinaryService.deleteFilesFromUrls(agency.logo ? [agency.logo] : []);

    await this.agencyModel.deleteOne({ _id: new Types.ObjectId(agencyId) });

    return { message: 'Agency deleted successfully' };
  }
}
