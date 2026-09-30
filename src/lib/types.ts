export interface CheckinRequest {
  rawCardId: string;
}

export type UserStatus = "active" | "inactive" | "archived" | "pending" | "unknown" | "restored";

export interface CheckinResponse {
  success: boolean;
  firstName?: string;
  lastName?: string;
  error?: string;
  errorCode?: "INVALID_CARD" | "CARD_NOT_FOUND" | "API_ERROR" | "FIRESTORE_ERROR" | "NEMO_ERROR";
  userStatus?: UserStatus;
  alreadyCheckedIn?: boolean;
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

export interface NemoArea {
  id: number;
  name: string;
}

export interface NemoAreaAccessResult {
  success: boolean;
  recordId?: number;
  error?: string;
}

export type KioskState = "idle" | "processing" | "success" | "error" | "restored" | "pending_user" | "unknown_user" | "already_checked_in";

export interface KioskData {
  firstName?: string;
  lastName?: string;
  errorMessage?: string;
  qrUrl?: string;
}
