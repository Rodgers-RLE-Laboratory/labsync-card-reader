export interface CheckinRequest {
  rawCardId: string;
}

export interface CheckinResponse {
  success: boolean;
  kerberosId?: string;
  firstName?: string;
  lastName?: string;
  error?: string;
  errorCode?: "INVALID_CARD" | "CARD_NOT_FOUND" | "API_ERROR" | "FIRESTORE_ERROR";
}

export interface CardLookupResult {
  krbName: string;
  firstName: string;
  lastName: string;
  mitId: string;
}

export interface CheckinRecord {
  kerberosId: string;
  firstName: string;
  lastName: string;
  mitId: string;
  timestamp: FirebaseFirestore.FieldValue;
  areaName: string;
}

export interface NemoAreaAccessResult {
  success: boolean;
  stubbed?: boolean;
  error?: string;
}

export type KioskState = "idle" | "processing" | "success" | "error";

export interface KioskData {
  firstName?: string;
  lastName?: string;
  errorMessage?: string;
}
