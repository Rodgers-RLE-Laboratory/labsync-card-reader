import { getDb } from "./firebase-admin";
import { UserStatus } from "./types";

export interface UserStatusResult {
  status: UserStatus;
}

export async function lookupUserStatus(kerberosId: string): Promise<UserStatusResult> {
  const db = getDb();

  // Check users collection first
  const usersSnap = await db
    .collection("users")
    .where("kerberosId", "==", kerberosId)
    .limit(1)
    .get();

  if (!usersSnap.empty) {
    const userData = usersSnap.docs[0].data();
    if (userData.activeAccount === true) {
      return { status: "active" };
    }
    return { status: "inactive" };
  }

  // Check users_archived
  const archivedSnap = await db
    .collection("users_archived")
    .where("kerberosId", "==", kerberosId)
    .limit(1)
    .get();

  if (!archivedSnap.empty) {
    return { status: "archived" };
  }

  // Check users_pending
  const pendingSnap = await db
    .collection("users_pending")
    .where("kerberosId", "==", kerberosId)
    .limit(1)
    .get();

  if (!pendingSnap.empty) {
    return { status: "pending" };
  }

  return { status: "unknown" };
}

export async function reactivateUser(kerberosId: string): Promise<void> {
  const db = getDb();
  const snap = await db
    .collection("users")
    .where("kerberosId", "==", kerberosId)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new Error(`User with kerberosId ${kerberosId} not found in users collection`);
  }

  await snap.docs[0].ref.update({ activeAccount: true });
}

export async function restoreArchivedUser(kerberosId: string): Promise<void> {
  const db = getDb();
  const snap = await db
    .collection("users_archived")
    .where("kerberosId", "==", kerberosId)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new Error(`User with kerberosId ${kerberosId} not found in users_archived collection`);
  }

  const doc = snap.docs[0];
  const data = doc.data();

  // Atomic batch: copy to users with activeAccount: true, delete from users_archived
  const batch = db.batch();
  const newUserRef = db.collection("users").doc(doc.id);
  batch.set(newUserRef, { ...data, activeAccount: true });
  batch.delete(doc.ref);
  await batch.commit();
}
