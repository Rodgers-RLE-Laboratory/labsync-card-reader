import { CardLookupResult } from "./types";
import { env } from "./env";

const TOKEN_URL =
  "https://mitprod.okta.com/oauth2/aus6sh93rjqnQuszg697/v1/token";
const CARD_API_URL =
  "https://global.api.mit.edu/scanned-id/v1/scanned-ids";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const clientId = env("MIT_CARD_CLIENT_ID");
  const clientSecret = env("MIT_CARD_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("MIT_CARD_CLIENT_ID and MIT_CARD_CLIENT_SECRET must be set");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "mit:system:profile.read-by-card",
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Token request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Expire 60 seconds early to avoid edge cases
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken!;
}

export async function lookupCard(cardId: string): Promise<CardLookupResult> {
  const token = await getAccessToken();

  const response = await fetch(CARD_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: cardId }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("CARD_NOT_FOUND");
    }
    throw new Error(
      `Card API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  return {
    krbName: data.krbName,
    firstName: data.firstName,
    lastName: data.lastName,
    mitId: data.mitid,
  };
}
