import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { hidToApi } from "@/lib/card-conversion";
import { lookupCard } from "@/lib/mit-card-api";
import { logCheckin, NemoOutcome } from "@/lib/firestore";
import { createAreaAccessRecord, isCheckedInToArea, nemoFailureReason } from "@/lib/nemo-api";
import { lookupUserStatus, reactivateUser, restoreArchivedUser } from "@/lib/user-status";
import { CheckinRequest, CheckinResponse } from "@/lib/types";
import { env } from "@/lib/env";

// Simple in-memory rate limiter: max requests per window per IP
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Periodically clean up stale entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of requestCounts) {
    if (now > entry.resetAt) requestCounts.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS);

export async function POST(request: Request): Promise<NextResponse<CheckinResponse>> {
  try {
    // Rate limit by client IP
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headersList.get("x-real-ip")
      || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait.", errorCode: "API_ERROR" },
        { status: 429 }
      );
    }
    const body: CheckinRequest = await request.json();
    const { rawCardId } = body;

    // Validate input: numeric, 5-15 digits
    if (!rawCardId || !/^\d{5,15}$/.test(rawCardId)) {
      return NextResponse.json(
        { success: false, error: "Invalid card ID format", errorCode: "INVALID_CARD" },
        { status: 400 }
      );
    }

    // Look up card identity
    let cardResult;
    const mockUser = env("MOCK_CARD_USER");
    if (mockUser) {
      // MOCK_CARD_USER=kerberosId:firstName:lastName:mitId
      const [krbName, firstName, lastName, mitId] = mockUser.split(":");
      cardResult = { krbName, firstName, lastName, mitId };
      console.warn("[Checkin] Using MOCK_CARD_USER — bypassing MIT Card API");
    } else {
      // Convert HID card format to API format
      const cardId = hidToApi(rawCardId);

      try {
        cardResult = await lookupCard(cardId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (message === "CARD_NOT_FOUND") {
          return NextResponse.json(
            { success: false, error: "Card not recognized", errorCode: "CARD_NOT_FOUND" },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { success: false, error: "Card API error", errorCode: "API_ERROR" },
          { status: 502 }
        );
      }
    }

    // Check user status in Firestore
    const { status: userStatus } = await lookupUserStatus(cardResult.krbName);

    // Pending users: remind about orientation, don't log check-in
    if (userStatus === "pending") {
      return NextResponse.json({
        success: false,
        firstName: cardResult.firstName,
        lastName: cardResult.lastName,
        userStatus: "pending",
      });
    }

    // Unknown users: not recognized, don't log check-in
    if (userStatus === "unknown") {
      return NextResponse.json({
        success: false,
        firstName: cardResult.firstName,
        lastName: cardResult.lastName,
        userStatus: "unknown",
      });
    }

    // Already checked in to this area in NEMO: ignore the repeat tap.
    // A lookup failure is held until after the Firestore backup log below,
    // so the tap is still recorded before the check-in fails.
    let nemoFailure: unknown = null;
    try {
      if (await isCheckedInToArea(cardResult.krbName)) {
        console.log(`[NEMO] ${cardResult.krbName} already checked in, ignoring tap`);
        return NextResponse.json({
          success: true,
          firstName: cardResult.firstName,
          lastName: cardResult.lastName,
          alreadyCheckedIn: true,
        });
      }
    } catch (err) {
      nemoFailure = err;
    }

    // Inactive users: reactivate
    if (userStatus === "inactive") {
      try {
        await reactivateUser(cardResult.krbName);
      } catch (err) {
        console.error("[UserStatus] Error reactivating user:", err);
      }
    }

    // Archived users: restore to users collection
    if (userStatus === "archived") {
      try {
        await restoreArchivedUser(cardResult.krbName);
      } catch (err) {
        console.error("[UserStatus] Error restoring archived user:", err);
      }
    }

    // NEMO area access record — the purpose of the check-in
    let nemoRecordId: number | undefined;
    if (!nemoFailure) {
      try {
        const result = await createAreaAccessRecord(cardResult.krbName);
        nemoRecordId = result.recordId;
      } catch (err) {
        nemoFailure = err;
      }
    }

    // Log to Firestore — a backup record of every tap, including whether it
    // reached NEMO, so a failure here is not fatal
    const nemoOutcome: NemoOutcome = nemoFailure
      ? { checkedIn: false, error: nemoFailure instanceof Error ? nemoFailure.message : String(nemoFailure) }
      : { checkedIn: true, recordId: nemoRecordId };
    try {
      const areaName = env("SITE_TITLE") || "Unknown";
      await logCheckin(cardResult, areaName, nemoOutcome);
    } catch (err) {
      console.error("[Firestore] Error logging check-in:", err);
    }

    // A NEMO failure fails the check-in, with a reason shown on the kiosk
    if (nemoFailure) {
      console.error(
        `[NEMO] Check-in failed for ${cardResult.krbName}:`,
        nemoFailure instanceof Error ? nemoFailure.message : nemoFailure
      );
      return NextResponse.json(
        { success: false, error: nemoFailureReason(nemoFailure), errorCode: "NEMO_ERROR" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      firstName: cardResult.firstName,
      lastName: cardResult.lastName,
      userStatus: userStatus === "inactive" || userStatus === "archived" ? "restored" as const : userStatus,
    });
  } catch (err) {
    console.error("[Checkin] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error", errorCode: "API_ERROR" },
      { status: 500 }
    );
  }
}
