export class CreateDemandDto {
  customerName: string;
  customerEmail: string;
  nbBedrooms: string[];
  zones: string[];
  mustHaveFeatures?: string[];
  additionalNotes?: string;
  budget: string;
}
