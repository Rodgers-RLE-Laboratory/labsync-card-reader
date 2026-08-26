import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import { CardLookupResult } from "./types";

export async function logCheckin(
  cardResult: CardLookupResult,
  areaName: string
): Promise<void> {
  const db = getDb();
  await db.collection("checkins").add({
    kerberosId: cardResult.krbName,
    firstName: cardResult.firstName,
    lastName: cardResult.lastName,
    mitId: cardResult.mitId,
    timestamp: FieldValue.serverTimestamp(),
    areaName,
  });
}
