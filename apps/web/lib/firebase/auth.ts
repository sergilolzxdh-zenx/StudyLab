import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/firebase/userProfile";

/**
 * Firestore profile creation is best-effort here: if Firestore isn't
 * provisioned yet, auth must still succeed — Firestore-backed screens are
 * responsible for their own honest "not available" state.
 */
async function ensureUserProfileSafe(user: User): Promise<void> {
  try {
    await ensureUserProfile(user);
  } catch (error) {
    console.error("No se pudo crear el perfil en Firestore:", error);
  }
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await ensureUserProfileSafe(credential.user);
  return credential.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfileSafe(credential.user);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await signInWithPopup(auth, new GoogleAuthProvider());
  await ensureUserProfileSafe(credential.user);
  return credential.user;
}

export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}
