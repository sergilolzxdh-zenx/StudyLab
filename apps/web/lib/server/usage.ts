import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebaseAdmin";

export class ProfileNotFoundError extends Error {}
export class InsufficientUsageError extends Error {}

interface UserProfileFields {
  plan?: "free" | "pro" | "premium";
  powermoney?: number;
}

/**
 * Atomically reserves `cost` uses BEFORE the paid AI call runs. A
 * read-then-decrement-later split would let concurrent requests all pass a
 * stale read before any of them writes, letting a user get more free calls
 * than their quota; a single transaction closes that race. Premium plans
 * are unlimited and never decremented. Returns whether a real decrement
 * happened, so the caller knows whether a later failure needs refunding.
 */
export async function reserveUse(uid: string, cost = 1): Promise<boolean> {
  const db = getDb();
  const ref = db.doc(`users/${uid}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new ProfileNotFoundError("No se encontró tu perfil.");
    }
    const data = snap.data() as UserProfileFields;
    if (data.plan === "premium") {
      return false;
    }
    const current = data.powermoney ?? 0;
    if (current < cost) {
      throw new InsufficientUsageError("No tienes usos disponibles.");
    }
    tx.update(ref, {
      powermoney: FieldValue.increment(-cost),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
}

/** Refunds a reservation after the paid AI call failed, so failures never cost the user a use. */
export async function refundUse(uid: string, cost = 1): Promise<void> {
  await getDb()
    .doc(`users/${uid}`)
    .update({ powermoney: FieldValue.increment(cost), updatedAt: FieldValue.serverTimestamp() });
}
