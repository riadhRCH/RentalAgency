export class CreateDemandDto {
  customerName: string;
  customerEmail: string;
  nbBedrooms: string[];
  mustHaveFeatures?: string[];
  additionalNotes?: string;
  budget: string;
}
