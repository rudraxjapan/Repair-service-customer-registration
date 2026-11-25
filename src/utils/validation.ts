import { CustomerFormInput, RepairRequestFormInput, SERVICE_CATEGORIES, SERVICE_TYPES } from '../types/repair';

// Constraints synchronized directly with firebase-blueprint.json
export const BLUEPRINT_CONSTRAINTS = {
  fullName: { minLength: 2, maxLength: 100 },
  mobileNumber: { minLength: 10, maxLength: 10, pattern: /^[0-9]{10}$/ },
  email: { minLength: 5, maxLength: 150, pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ },
  address: { minLength: 5, maxLength: 300 },
  city: { minLength: 2, maxLength: 80, pattern: /^[a-zA-Z\s.\-']{2,80}$/ },
  pinCode: { minLength: 6, maxLength: 6, pattern: /^[0-9]{6}$/ },
  deviceBrand: { minLength: 1, maxLength: 60 },
  deviceModel: { minLength: 1, maxLength: 80 },
  problemDescription: { minLength: 10, maxLength: 1000 },
  preferredDate: { minLength: 8, maxLength: 20, pattern: /^\d{4}-\d{2}-\d{2}$/ },
  adminNotes: { maxLength: 500 },
};

export type CustomerFieldErrors = Partial<Record<keyof CustomerFormInput, string>>;
export type RepairFieldErrors = Partial<Record<keyof RepairRequestFormInput, string>>;

export function validateCustomerForm(input: CustomerFormInput): CustomerFieldErrors {
  const errors: CustomerFieldErrors = {};

  const fullName = input.fullName.trim();
  if (fullName.length < BLUEPRINT_CONSTRAINTS.fullName.minLength) {
    errors.fullName = 'Full name must be at least 2 characters.';
  } else if (fullName.length > BLUEPRINT_CONSTRAINTS.fullName.maxLength) {
    errors.fullName = 'Full name cannot exceed 100 characters.';
  }

  const mobile = input.mobileNumber.trim();
  if (!BLUEPRINT_CONSTRAINTS.mobileNumber.pattern.test(mobile)) {
    errors.mobileNumber = 'Mobile number must be exactly 10 digits.';
  }

  const email = input.email.trim();
  if (
    email.length < BLUEPRINT_CONSTRAINTS.email.minLength ||
    email.length > BLUEPRINT_CONSTRAINTS.email.maxLength ||
    !BLUEPRINT_CONSTRAINTS.email.pattern.test(email)
  ) {
    errors.email = 'Enter a valid email address.';
  }

  const address = input.address.trim();
  if (address.length < BLUEPRINT_CONSTRAINTS.address.minLength) {
    errors.address = 'Complete address must be at least 5 characters.';
  } else if (address.length > BLUEPRINT_CONSTRAINTS.address.maxLength) {
    errors.address = 'Address cannot exceed 300 characters.';
  }

  const city = input.city.trim();
  if (city.length < BLUEPRINT_CONSTRAINTS.city.minLength) {
    errors.city = 'City must be at least 2 characters.';
  } else if (city.length > BLUEPRINT_CONSTRAINTS.city.maxLength) {
    errors.city = 'City cannot exceed 80 characters.';
  } else if (!BLUEPRINT_CONSTRAINTS.city.pattern.test(city)) {
    errors.city = 'City name cannot contain numbers or special symbols.';
  }

  const pinCode = input.pinCode.trim();
  if (!BLUEPRINT_CONSTRAINTS.pinCode.pattern.test(pinCode)) {
    errors.pinCode = 'PIN code must be exactly 6 digits.';
  }

  return errors;
}

export function validateRepairForm(input: RepairRequestFormInput): RepairFieldErrors {
  const errors: RepairFieldErrors = {};

  if (!SERVICE_CATEGORIES.includes(input.serviceCategory)) {
    errors.serviceCategory = 'Select a valid service category.';
  }

  const brand = input.deviceBrand.trim();
  if (brand.length < BLUEPRINT_CONSTRAINTS.deviceBrand.minLength) {
    errors.deviceBrand = 'Device brand is required.';
  } else if (brand.length > BLUEPRINT_CONSTRAINTS.deviceBrand.maxLength) {
    errors.deviceBrand = 'Device brand cannot exceed 60 characters.';
  }

  const model = input.deviceModel.trim();
  if (model.length < BLUEPRINT_CONSTRAINTS.deviceModel.minLength) {
    errors.deviceModel = 'Device model is required.';
  } else if (model.length > BLUEPRINT_CONSTRAINTS.deviceModel.maxLength) {
    errors.deviceModel = 'Device model cannot exceed 80 characters.';
  }

  const problem = input.problemDescription.trim();
  if (problem.length < BLUEPRINT_CONSTRAINTS.problemDescription.minLength) {
    errors.problemDescription = 'Describe the problem in at least 10 characters.';
  } else if (problem.length > BLUEPRINT_CONSTRAINTS.problemDescription.maxLength) {
    errors.problemDescription = 'Problem description cannot exceed 1000 characters.';
  }

  const date = input.preferredDate.trim();
  if (!BLUEPRINT_CONSTRAINTS.preferredDate.pattern.test(date)) {
    errors.preferredDate = 'Select a valid preferred date (YYYY-MM-DD).';
  }

  if (!SERVICE_TYPES.includes(input.serviceType)) {
    errors.serviceType = 'Select Home Service or Service Center.';
  }

  return errors;
}

export function sanitizeCustomerInput(input: CustomerFormInput): CustomerFormInput {
  return {
    fullName: input.fullName.trim().slice(0, BLUEPRINT_CONSTRAINTS.fullName.maxLength),
    mobileNumber: input.mobileNumber.trim().slice(0, BLUEPRINT_CONSTRAINTS.mobileNumber.maxLength),
    email: input.email.trim().slice(0, BLUEPRINT_CONSTRAINTS.email.maxLength),
    address: input.address.trim().slice(0, BLUEPRINT_CONSTRAINTS.address.maxLength),
    city: input.city.trim().slice(0, BLUEPRINT_CONSTRAINTS.city.maxLength),
    pinCode: input.pinCode.trim().slice(0, BLUEPRINT_CONSTRAINTS.pinCode.maxLength),
  };
}

export function sanitizeRepairInput(input: RepairRequestFormInput): RepairRequestFormInput {
  return {
    serviceCategory: input.serviceCategory,
    deviceBrand: input.deviceBrand.trim().slice(0, BLUEPRINT_CONSTRAINTS.deviceBrand.maxLength),
    deviceModel: input.deviceModel.trim().slice(0, BLUEPRINT_CONSTRAINTS.deviceModel.maxLength),
    problemDescription: input.problemDescription
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.problemDescription.maxLength),
    preferredDate: input.preferredDate.trim().slice(0, BLUEPRINT_CONSTRAINTS.preferredDate.maxLength),
    serviceType: input.serviceType,
  };
}
