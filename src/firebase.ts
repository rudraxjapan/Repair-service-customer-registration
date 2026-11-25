import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore, type Firestore } from 'firebase/firestore';

interface FirebaseAppletConfig {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

const configModules = import.meta.glob('/firebase-applet-config.json', {
  eager: true,
  import: 'default',
}) as Record<string, FirebaseAppletConfig>;

const fileConfig: FirebaseAppletConfig =
  configModules['/firebase-applet-config.json'] ?? {};

const firebaseConfig = {
  projectId: fileConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: fileConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
  apiKey: fileConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: fileConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  firestoreDatabaseId:
    fileConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
  storageBucket: fileConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId:
    fileConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  measurementId: fileConfig.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId &&
    firebaseConfig.apiKey &&
    firebaseConfig.appId &&
    !firebaseConfig.projectId.startsWith('YOUR_')
);

const app: FirebaseApp | null = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db: Firestore | null = app
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : null;
export const auth: Auth | null = app ? getAuth(app) : null;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function requireAuth(): Auth {
  if (!auth || !isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured yet. Add firebase-applet-config.json or VITE_FIREBASE_* environment variables.'
    );
  }
  return auth;
}

export async function signInWithGoogle() {
  return signInWithPopup(requireAuth(), googleProvider);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(requireAuth(), email.trim(), password);
}

export async function registerWithEmail(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(
    requireAuth(),
    email.trim(),
    password
  );
  await sendEmailVerification(credential.user);
  return credential;
}

export async function resendVerificationEmail() {
  const activeAuth = requireAuth();
  if (!activeAuth.currentUser) throw new Error('No signed-in user.');
  await sendEmailVerification(activeAuth.currentUser);
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(requireAuth(), email.trim());
}

export async function reloadVerifiedUser() {
  const activeAuth = requireAuth();
  if (!activeAuth.currentUser) return null;
  await activeAuth.currentUser.reload();
  await activeAuth.currentUser.getIdToken(true);
  return activeAuth.currentUser;
}

export async function signOutUser() {
  if (!auth) return;
  return signOut(auth);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (!db || !isFirebaseConfigured) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
