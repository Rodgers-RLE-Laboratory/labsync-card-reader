import { NemoAreaAccessResult } from "./types";

/**
 * Create a NEMO area access record.
 * STUBBED: Logs what would be sent and returns success.
 * NEMO failure is non-fatal — Firestore check-in still succeeds.
 */
export async function createAreaAccessRecord(
  kerberosId: string
): Promise<NemoAreaAccessResult> {
  const nemoUrl = process.env.NEMO_URL;
  const nemoToken = process.env.NEMO_API_TOKEN;
  const areaId = process.env.NEMO_AREA_ID;

  console.log("[NEMO STUB] Would create area access record:", {
    url: `${nemoUrl}area_access_records/`,
    areaId,
    kerberosId,
    headers: { Authorization: `Token ${nemoToken ? "***" : "NOT SET"}` },
  });

  return { success: true, stubbed: true };
}
