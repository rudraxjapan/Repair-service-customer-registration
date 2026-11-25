import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  CustomerFormInput,
  CustomerProfile,
  RepairRequest,
  RepairRequestFormInput,
  RepairStatus,
} from '../types/repair';
import {
  BLUEPRINT_CONSTRAINTS,
  sanitizeCustomerInput,
  sanitizeRepairInput,
} from '../utils/validation';

const CUSTOMERS_COLLECTION = 'customers';
const REQUESTS_COLLECTION = 'repairRequests';
const ADMINS_COLLECTION = 'admins';

function requireDb() {
  if (!db) {
    throw new Error(
      'Firestore is not configured. Add firebase-applet-config.json or VITE_FIREBASE_* environment variables.'
    );
  }
  return db;
}

export async function checkIsAdmin(
  uid: string,
  _email: string | null,
  emailVerified: boolean
): Promise<boolean> {
  if (!emailVerified || !db) return false;

  try {
    const snap = await getDoc(doc(db, ADMINS_COLLECTION, uid));
    return snap.exists();
  } catch (error) {
    console.warn('Admin check fallback:', error);
    return false;
  }
}

export function subscribeToCustomerProfile(
  uid: string,
  onData: (profile: CustomerProfile | null) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const firestore = requireDb();
  const path = `${CUSTOMERS_COLLECTION}/${uid}`;
  return onSnapshot(
    doc(firestore, CUSTOMERS_COLLECTION, uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(snapshot.data() as CustomerProfile);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function saveCustomerProfile(
  uid: string,
  rawInput: CustomerFormInput,
  isExisting: boolean
): Promise<void> {
  const clean = sanitizeCustomerInput(rawInput);
  const path = `${CUSTOMERS_COLLECTION}/${uid}`;
  const docRef = doc(requireDb(), CUSTOMERS_COLLECTION, uid);

  try {
    if (isExisting) {
      await updateDoc(docRef, {
        fullName: clean.fullName,
        mobileNumber: clean.mobileNumber,
        email: clean.email,
        address: clean.address,
        city: clean.city,
        pinCode: clean.pinCode,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        uid,
        fullName: clean.fullName,
        mobileNumber: clean.mobileNumber,
        email: clean.email,
        address: clean.address,
        city: clean.city,
        pinCode: clean.pinCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export function generateUniqueRequestId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  const randomBytes = new Uint8Array(6);
  crypto.getRandomValues(randomBytes);
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[randomBytes[i] % chars.length];
  }
  return `REP-${y}${m}${d}-${suffix}`;
}

export async function submitRepairRequest(
  customer: CustomerProfile,
  rawInput: RepairRequestFormInput
): Promise<string> {
  const clean = sanitizeRepairInput(rawInput);
  const requestId = generateUniqueRequestId();
  const path = `${REQUESTS_COLLECTION}/${requestId}`;

  try {
    await setDoc(doc(requireDb(), REQUESTS_COLLECTION, requestId), {
      requestId,
      customerId: customer.uid,
      customerName: customer.fullName.trim().slice(0, BLUEPRINT_CONSTRAINTS.fullName.maxLength),
      customerMobile: customer.mobileNumber.replace(/\D/g, '').slice(-10),
      serviceCategory: clean.serviceCategory,
      deviceBrand: clean.deviceBrand,
      deviceModel: clean.deviceModel,
      problemDescription: clean.problemDescription,
      preferredDate: clean.preferredDate,
      serviceType: clean.serviceType,
      status: 'Pending' satisfies RepairStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return requestId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToCustomerRequests(
  uid: string,
  onData: (requests: RepairRequest[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(requireDb(), REQUESTS_COLLECTION), where('customerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => d.data() as RepairRequest)
        .sort((a, b) => {
          const secA = a.createdAt?.seconds ?? 0;
          const secB = b.createdAt?.seconds ?? 0;
          return secB - secA;
        });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, REQUESTS_COLLECTION);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function cancelPendingRequest(requestId: string): Promise<void> {
  const path = `${REQUESTS_COLLECTION}/${requestId}`;
  try {
    await updateDoc(doc(requireDb(), REQUESTS_COLLECTION, requestId), {
      status: 'Cancelled' satisfies RepairStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToAllCustomers(
  onData: (customers: CustomerProfile[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(requireDb(), CUSTOMERS_COLLECTION),
    (snapshot) => {
      const list = snapshot.docs
        .map((d) => d.data() as CustomerProfile)
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, CUSTOMERS_COLLECTION);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeToAllRepairRequests(
  onData: (requests: RepairRequest[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(requireDb(), REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as RepairRequest);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, REQUESTS_COLLECTION);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function updateRepairStatus(
  requestId: string,
  status: RepairStatus,
  adminNotes: string
): Promise<void> {
  const path = `${REQUESTS_COLLECTION}/${requestId}`;
  const trimmedNotes = adminNotes.trim().slice(0, BLUEPRINT_CONSTRAINTS.adminNotes.maxLength);

  try {
    const payload: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (trimmedNotes.length > 0) {
      payload.adminNotes = trimmedNotes;
    }
    await updateDoc(doc(requireDb(), REQUESTS_COLLECTION, requestId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
