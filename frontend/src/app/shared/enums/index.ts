// Property Type Enum
export enum PropertyType {
  APARTMENT = 'apartment',
  VILLA = 'villa',
  HOUSE = 'house',
  LAND = 'land'
}

// Property Status Enum
export enum PropertyStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  RENTED = 'rented',
  SOLD = 'sold'
}

// Lead Status Enum
export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  LOST = 'LOST'
}

// Visit Request Status Enum
export enum VisitRequestStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Rental Status Enum
export enum RentalStatus {
  CURRENT = 'CURRENT',
  EXPIRING_SOON = 'EXPIRING_SOON',
  OVERDUE = 'OVERDUE',
  CLOSED = 'CLOSED'
}

// Activity Type Enum
export enum ActivityType {
  CALL = 'CALL',
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  MANUAL = 'MANUAL'
}

// Team Role Enum
export enum TeamRole {
  AGENT = 'agent',
  ADMIN = 'admin'
}

// Identity Verification Status Enum
export enum IdentityVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

// Rental Source Type Enum
export enum RentalSourceType {
  LEAD = 'LEAD',
  VISIT = 'VISIT',
  DIRECT = 'DIRECT'
}

// Payment Type Enum
export enum PaymentType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  DIRECT_SALE = 'DIRECT_SALE'
}

// Helper function to get enum values
export const getEnumValues = (enumObj: any): string[] => {
  return Object.values(enumObj) as string[];
};

// Helper function to get enum label
export const getEnumLabel = (value: string, translations: any): string => {
  const key = `ENUM.${value}`;
  return translations[key] || value;
};
