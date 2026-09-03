import { getFirestore, type Firestore } from "firebase/firestore";
import { getApps, getApp, initializeApp, type FirebaseOptions } from "firebase/app";
import { isFirebaseConfigured } from "@/lib/firebase/client";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let cachedDb: Firestore | null = null;

export function getDb(): Firestore {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase no está configurado todavía. Añade las variables NEXT_PUBLIC_FIREBASE_* en apps/web/.env.local."
    );
  }
  if (!cachedDb) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    cachedDb = getFirestore(app);
  }
  return cachedDb;
}
