import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import { CardLookupResult } from "./types";

export interface CheckinArea {
  id?: number;
  name?: string;
}

export interface NemoOutcome {
  checkedIn: boolean;
  recordId?: number;
  error?: string;
}

export async function logCheckin(
  cardResult: CardLookupResult,
  area: CheckinArea,
  nemo: NemoOutcome
): Promise<void> {
  const db = getDb();
  await db.collection("checkins").add({
    kerberosId: cardResult.krbName,
    firstName: cardResult.firstName,
    lastName: cardResult.lastName,
    mitId: cardResult.mitId,
    timestamp: FieldValue.serverTimestamp(),
    // Firestore rejects undefined values, so only include fields that are set
    ...(area.id !== undefined && { nemoAreaId: area.id }),
    ...(area.name !== undefined && { areaName: area.name }),
    // Query nemoCheckedIn == false to find taps that never reached NEMO
    nemoCheckedIn: nemo.checkedIn,
    ...(nemo.recordId !== undefined && { nemoRecordId: nemo.recordId }),
    ...(nemo.error !== undefined && { nemoError: nemo.error }),
  });
}
