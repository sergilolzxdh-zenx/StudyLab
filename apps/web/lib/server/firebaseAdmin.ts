import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

/**
 * Firebase Cloud Functions were dropped for this project — they require the
 * Blaze plan even to deploy, regardless of secrets. This runs instead as
 * Next.js Route Handlers (app/api/*), deployable on any Node host (Vercel's
 * free tier included) with zero Firebase billing plan requirement.
 *
 * Locally, set FIRESTORE_EMULATOR_HOST in apps/web/.env.local to talk to
 * `firebase emulators:start --only firestore` instead of real data — no
 * service account needed for that. In production, real Admin SDK
 * credentials (FIREBASE_ADMIN_*) are required.
 *
 * Initialization is lazy (only on first real use, inside a request) so
 * `next build` — which loads this module just to collect route metadata,
 * with no real request and no env vars available — never crashes.
 */
function createAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    // Without this, google-auth-library still probes the (nonexistent, on a
    // dev machine) GCE metadata server before giving up — adds ~45s of pure
    // waiting per cold start for no reason, since the emulator needs no
    // real credentials at all.
    process.env.NO_GCE_CHECK = "true";
    return initializeApp({ projectId });
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin no está configurado. Añade FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL y FIREBASE_ADMIN_PRIVATE_KEY (o FIRESTORE_EMULATOR_HOST para desarrollo local)."
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

let cachedApp: App | null = null;
function getAdminApp(): App {
  if (!cachedApp) cachedApp = createAdminApp();
  return cachedApp;
}

let cachedDb: Firestore | null = null;
export function getDb(): Firestore {
  if (!cachedDb) cachedDb = getFirestore(getAdminApp());
  return cachedDb;
}

let cachedAuth: Auth | null = null;
export function getAdminAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(getAdminApp());
  return cachedAuth;
}
