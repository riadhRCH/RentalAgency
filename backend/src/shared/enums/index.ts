// Property Type Enum
export enum PropertyType {
  APARTMENT = 'apartment',
  VILLA = 'villa',
  HOUSE = 'house',
  LAND = 'land',
}

// Property Status Enum
export enum PropertyStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  RENTED = 'rented',
  SOLD = 'sold',
}

// Lead Status Enum
export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  LOST = 'LOST',
}

// Activity Type Enum
export enum ActivityType {
  CALL = 'CALL',
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  MANUAL = 'MANUAL',
}

// Visit Request Status Enum
export enum VisitRequestStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Rental Status Enum
export enum RentalStatus {
  CURRENT = 'CURRENT',
  EXPIRING_SOON = 'EXPIRING_SOON',
  OVERDUE = 'OVERDUE',
  CLOSED = 'CLOSED',
}

// Identity Verification Status Enum
export enum IdentityVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// Rental Source Type Enum
export enum RentalSourceType {
  LEAD = 'LEAD',
  VISIT = 'VISIT',
  DIRECT = 'DIRECT',
}

// Payment Frequency Enum
export enum PaymentFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

// Team Role Enum
export enum TeamRole {
  AGENT = 'agent',
  ADMIN = 'admin',
}

// Helper function to get enum values
export const getEnumValues = (enumObj: any): string[] => {
  return Object.values(enumObj);
};
