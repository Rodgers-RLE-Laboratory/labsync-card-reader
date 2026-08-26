import { NemoUser, NemoAreaAccessResult } from "./types";

/**
 * Look up a NEMO user by their kerberos username.
 */
async function lookupNemoUser(kerberosId: string): Promise<NemoUser> {
  const nemoUrl = process.env.NEMO_URL;
  const nemoToken = process.env.NEMO_API_TOKEN;

  const response = await fetch(`${nemoUrl}users/?username=${kerberosId}`, {
    headers: { Authorization: `Token ${nemoToken}` },
  });

  if (!response.ok) {
    throw new Error(`NEMO user lookup failed: ${response.status}`);
  }

  const users: NemoUser[] = await response.json();
  if (users.length === 0) {
    throw new Error(`NEMO user not found: ${kerberosId}`);
  }

  return users[0];
}

/**
 * Create a NEMO area access record for the given kerberos user.
 * Looks up the user by username, then POSTs an area access record
 * using the user's ID and first project.
 */
export async function createAreaAccessRecord(
  kerberosId: string
): Promise<NemoAreaAccessResult> {
  const nemoUrl = process.env.NEMO_URL;
  const nemoToken = process.env.NEMO_API_TOKEN;
  const areaId = process.env.NEMO_AREA_ID;

  if (!nemoUrl || !nemoToken || !areaId) {
    console.log("[NEMO] Skipping — NEMO_URL, NEMO_API_TOKEN, or NEMO_AREA_ID not configured");
    return { success: true };
  }

  const user = await lookupNemoUser(kerberosId);

  if (user.projects.length === 0) {
    throw new Error(`NEMO user ${kerberosId} has no projects assigned`);
  }

  const response = await fetch(`${nemoUrl}area_access_records/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${nemoToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer: user.id,
      area: Number(areaId),
      project: user.projects[0],
    }),
  });

  if (!response.ok) {
    throw new Error(`NEMO area access record creation failed: ${response.status}`);
  }

  const record = await response.json();
  console.log("[NEMO] Created area access record:", record.id);
  return { success: true, recordId: record.id };
}
