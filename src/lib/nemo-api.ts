import { NemoUser, NemoAreaAccessResult } from "./types";
import { env } from "./env";

// Abort NEMO requests that hang so the kiosk doesn't sit on "processing"
const NEMO_TIMEOUT_MS = 10_000;

interface NemoConfig {
  nemoUrl: string;
  nemoToken: string;
  areaId: string;
}

/**
 * A NEMO failure with a short, user-facing reason suitable for the kiosk
 * screen. `message` holds the full technical detail for the logs.
 */
export class NemoError extends Error {
  readonly reason: string;

  constructor(message: string, reason: string) {
    super(message);
    this.name = "NemoError";
    this.reason = reason;
  }
}

/**
 * Get the user-facing reason for a NEMO failure.
 */
export function nemoFailureReason(err: unknown): string {
  if (err instanceof NemoError) {
    return err.reason;
  }
  return "Could not check in to NEMO. Please contact lab staff.";
}

/**
 * Read NEMO settings. NEMO is required, so a missing setting fails the
 * check-in rather than silently skipping NEMO.
 */
function getNemoConfig(): NemoConfig {
  const nemoUrl = env("NEMO_URL");
  const nemoToken = env("NEMO_API_TOKEN");
  const areaId = env("NEMO_AREA_ID");

  if (!nemoUrl || !nemoToken || !areaId) {
    throw new NemoError(
      "NEMO_URL, NEMO_API_TOKEN, or NEMO_AREA_ID not configured",
      "This kiosk is not set up for NEMO. Please contact lab staff."
    );
  }

  return { nemoUrl, nemoToken, areaId };
}

/**
 * Make an authenticated request to the NEMO API, converting network
 * failures and timeouts into a NemoError.
 */
async function nemoFetch(
  config: NemoConfig,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  try {
    return await fetch(`${config.nemoUrl}${path}`, {
      ...init,
      headers: { Authorization: `Token ${config.nemoToken}`, ...init.headers },
      signal: AbortSignal.timeout(NEMO_TIMEOUT_MS),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new NemoError(
      `NEMO request to ${path} failed: ${detail}`,
      "Could not reach NEMO. Please try again or contact lab staff."
    );
  }
}

/**
 * Collect the human-readable messages from a NEMO (Django REST Framework)
 * error body, e.g. {"customer": ["..."], "non_field_errors": ["..."]}.
 */
function collectMessages(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectMessages);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectMessages);
  return [];
}

/**
 * Build a NemoError from a failed response, using NEMO's response body to
 * explain why the request was rejected where possible.
 */
async function nemoResponseError(message: string, response: Response): Promise<NemoError> {
  const body = await response.text().catch(() => "");
  const detail = `${message}: ${response.status} ${body}`.trim();

  if (response.status === 401 || response.status === 403) {
    return new NemoError(detail, "This kiosk is not authorized with NEMO. Please contact lab staff.");
  }
  if (response.status >= 500) {
    return new NemoError(detail, "NEMO is unavailable. Please try again or contact lab staff.");
  }

  let messages: string[] = [];
  try {
    messages = collectMessages(JSON.parse(body));
  } catch {
    // Not JSON — fall through to the generic reason
  }

  if (messages.length > 0) {
    return new NemoError(detail, messages.join(" "));
  }
  return new NemoError(detail, `NEMO rejected the check-in (error ${response.status}). Please contact lab staff.`);
}

/**
 * Look up a NEMO user by their kerberos username.
 */
async function lookupNemoUser(kerberosId: string, config: NemoConfig): Promise<NemoUser> {
  const response = await nemoFetch(config, `users/?username=${encodeURIComponent(kerberosId)}`);

  if (!response.ok) {
    throw await nemoResponseError("NEMO user lookup failed", response);
  }

  const users: NemoUser[] = await response.json();
  if (users.length === 0) {
    throw new NemoError(
      `NEMO user not found: ${kerberosId}`,
      "No NEMO account found. Please contact lab staff."
    );
  }

  return users[0];
}

/**
 * Check whether the given kerberos user already has an open (not yet ended)
 * area access record for this kiosk's area.
 */
export async function isCheckedInToArea(kerberosId: string): Promise<boolean> {
  const config = getNemoConfig();
  const user = await lookupNemoUser(kerberosId, config);

  const response = await nemoFetch(
    config,
    `area_access_records/?customer=${user.id}&area=${config.areaId}&end__isnull=true`
  );

  if (!response.ok) {
    throw await nemoResponseError("NEMO area access record lookup failed", response);
  }

  const openRecords: unknown[] = await response.json();
  return openRecords.length > 0;
}

/**
 * Create a NEMO area access record for the given kerberos user.
 * Looks up the user by username, then POSTs an area access record
 * using the user's ID and first project.
 */
export async function createAreaAccessRecord(
  kerberosId: string
): Promise<NemoAreaAccessResult> {
  const config = getNemoConfig();
  const user = await lookupNemoUser(kerberosId, config);

  if (user.projects.length === 0) {
    throw new NemoError(
      `NEMO user ${kerberosId} has no projects assigned`,
      "No NEMO project assigned. Please contact lab staff."
    );
  }

  const response = await nemoFetch(config, "area_access_records/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: user.id,
      area: Number(config.areaId),
      project: user.projects[0],
    }),
  });

  if (!response.ok) {
    throw await nemoResponseError("NEMO area access record creation failed", response);
  }

  const record = await response.json();
  console.log("[NEMO] Created area access record:", record.id);
  return { success: true, recordId: record.id };
}
