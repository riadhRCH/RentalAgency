import { Model } from 'mongoose';
import { LeadDocument } from '../schemas/lead.schema';
import { RentalAgencyDocument } from '../schemas/rental-agency.schema';
export declare class WebhooksService {
    private readonly leadModel;
    private readonly agencyModel;
    constructor(leadModel: Model<LeadDocument>, agencyModel: Model<RentalAgencyDocument>);
    generateInboundTwiml(toNumber: string, forwardingNumber: string): string;
    handleInbound(body: Record<string, string>): Promise<string>;
    handleCompleted(body: Record<string, string>): Promise<void>;
}
