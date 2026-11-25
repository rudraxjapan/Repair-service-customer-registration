import { Timestamp } from 'firebase/firestore';

export const SERVICE_CATEGORIES = [
  'Mobile',
  'Laptop',
  'Computer',
  'Television',
  'Refrigerator',
  'Washing Machine',
  'Other',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const SERVICE_TYPES = ['Home Service', 'Service Center'] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const REPAIR_STATUSES = [
  'Pending',
  'Accepted',
  'In Progress',
  'Completed',
  'Cancelled',
] as const;

export type RepairStatus = (typeof REPAIR_STATUSES)[number];

export interface CustomerProfile {
  uid: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  address: string;
  city: string;
  pinCode: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CustomerFormInput {
  fullName: string;
  mobileNumber: string;
  email: string;
  address: string;
  city: string;
  pinCode: string;
}

export interface RepairRequest {
  requestId: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  serviceCategory: ServiceCategory;
  deviceBrand: string;
  deviceModel: string;
  problemDescription: string;
  preferredDate: string;
  serviceType: ServiceType;
  status: RepairStatus;
  adminNotes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RepairRequestFormInput {
  serviceCategory: ServiceCategory;
  deviceBrand: string;
  deviceModel: string;
  problemDescription: string;
  preferredDate: string;
  serviceType: ServiceType;
}

export type AppSection =
  | 'overview'
  | 'registration'
  | 'request-repair'
  | 'admin';
