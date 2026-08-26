export interface CheckinRequest {
  rawCardId: string;
}

export type UserStatus = "active" | "inactive" | "archived" | "pending" | "unknown" | "restored";

export interface CheckinResponse {
  success: boolean;
  firstName?: string;
  lastName?: string;
  error?: string;
  errorCode?: "INVALID_CARD" | "CARD_NOT_FOUND" | "API_ERROR" | "FIRESTORE_ERROR";
  userStatus?: UserStatus;
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

export interface NemoUser {
  id: number;
  username: string;
  projects: number[];
}

export interface NemoAreaAccessResult {
  success: boolean;
  recordId?: number;
  error?: string;
}

export type KioskState = "idle" | "processing" | "success" | "error" | "restored" | "pending_user" | "unknown_user";

export interface KioskData {
  firstName?: string;
  lastName?: string;
  errorMessage?: string;
  qrUrl?: string;
}
