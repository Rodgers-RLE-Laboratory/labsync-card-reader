import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import { CardLookupResult } from "./types";

export interface NemoOutcome {
  checkedIn: boolean;
  recordId?: number;
  error?: string;
}

export async function logCheckin(
  cardResult: CardLookupResult,
  areaName: string,
  nemo: NemoOutcome
): Promise<void> {
  const db = getDb();
  await db.collection("checkins").add({
    kerberosId: cardResult.krbName,
    firstName: cardResult.firstName,
    lastName: cardResult.lastName,
    mitId: cardResult.mitId,
    timestamp: FieldValue.serverTimestamp(),
    areaName,
    // Query nemoCheckedIn == false to find taps that never reached NEMO
    nemoCheckedIn: nemo.checkedIn,
    // Firestore rejects undefined values, so only include fields that are set
    ...(nemo.recordId !== undefined && { nemoRecordId: nemo.recordId }),
    ...(nemo.error !== undefined && { nemoError: nemo.error }),
  });
}
