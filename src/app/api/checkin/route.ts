import { NextResponse } from "next/server";
import { hidToApi } from "@/lib/card-conversion";
import { lookupCard } from "@/lib/mit-card-api";
import { logCheckin } from "@/lib/firestore";
import { createAreaAccessRecord } from "@/lib/nemo-api";
import { CheckinRequest, CheckinResponse } from "@/lib/types";

export async function POST(request: Request): Promise<NextResponse<CheckinResponse>> {
  try {
    const body: CheckinRequest = await request.json();
    const { rawCardId } = body;

    // Validate input: numeric, 5-15 digits
    if (!rawCardId || !/^\d{5,15}$/.test(rawCardId)) {
      return NextResponse.json(
        { success: false, error: "Invalid card ID format", errorCode: "INVALID_CARD" },
        { status: 400 }
      );
    }

    // Convert HID card format to API format
    const cardId = hidToApi(rawCardId);

    // Look up card via MIT Card API
    let cardResult;
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

    // Log to Firestore
    try {
      const areaName = process.env.SITE_TITLE || "Unknown";
      await logCheckin(cardResult, areaName);
    } catch (err) {
      console.error("[Firestore] Error logging check-in:", err);
      return NextResponse.json(
        { success: false, error: "Failed to log check-in", errorCode: "FIRESTORE_ERROR" },
        { status: 500 }
      );
    }

    // NEMO area access (non-fatal)
    try {
      await createAreaAccessRecord(cardResult.krbName);
    } catch (err) {
      console.error("[NEMO] Non-fatal error creating area access record:", err);
    }

    return NextResponse.json({
      success: true,
      kerberosId: cardResult.krbName,
      firstName: cardResult.firstName,
      lastName: cardResult.lastName,
    });
  } catch (err) {
    console.error("[Checkin] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error", errorCode: "API_ERROR" },
      { status: 500 }
    );
  }
}
