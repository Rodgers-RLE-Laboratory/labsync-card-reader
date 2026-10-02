/**
 * Readers output card IDs in one of these forms:
 * - Decimal digits (e.g. OmniKey 5427CK), 5-15 digits
 * - Hex of the raw 35-bit HID Corporate 1000 credential, 9-10 chars
 *   (e.g. "0788c724ce"), read from the card's 125 kHz Prox side
 * - Hex of a 4-byte chip serial number, 8 chars (e.g. "8236288a"), read
 *   from the card's 13.56 MHz side
 *
 * Decimal and hex can't always be told apart: an 8-char serial number made
 * only of digits looks like a decimal ID. CARD_READER_FORMAT tells us which
 * the kiosk's reader sends. In "auto" mode, all-digit IDs are treated as
 * decimal. (35-bit IDs are safe either way: MIT's company code (3142) always
 * puts a "C" or "D" in their hex.)
 */
export type CardReaderFormat = "auto" | "decimal" | "hex";

type CardIdKind = "decimal" | "hexSerial" | "hexCorporate1000";

const DECIMAL_CARD_ID = /^\d{5,15}$/;
const HEX_SERIAL_ID = /^[0-9a-f]{8}$/i;
const HEX_CORPORATE_1000_ID = /^[0-9a-f]{9,10}$/i;
const TWO_POW_33 = 2 ** 33;
const TWO_POW_35 = 2 ** 35;

/**
 * Parse the CARD_READER_FORMAT setting. Unknown values fall back to "auto"
 * so a typo doesn't stop every card from working.
 */
export function parseCardReaderFormat(value: string | undefined): CardReaderFormat {
  const format = (value || "auto").trim().toLowerCase();
  if (format === "auto" || format === "decimal" || format === "hex") {
    return format;
  }
  console.warn(`[Card] Unknown CARD_READER_FORMAT ${JSON.stringify(value)}, using "auto"`);
  return "auto";
}

function classifyHex(rawCardId: string): CardIdKind | null {
  if (HEX_SERIAL_ID.test(rawCardId)) {
    return "hexSerial";
  }
  // Must also fit in 35 bits (Corporate 1000 format)
  if (HEX_CORPORATE_1000_ID.test(rawCardId) && parseInt(rawCardId, 16) < TWO_POW_35) {
    return "hexCorporate1000";
  }
  return null;
}

function classifyCardId(rawCardId: string, format: CardReaderFormat): CardIdKind | null {
  const isDecimal = DECIMAL_CARD_ID.test(rawCardId);

  switch (format) {
    case "decimal":
      return isDecimal ? "decimal" : null;
    case "hex":
      return classifyHex(rawCardId);
    case "auto":
      return isDecimal ? "decimal" : classifyHex(rawCardId);
  }
}

export function isValidCardId(rawCardId: string, format: CardReaderFormat): boolean {
  return classifyCardId(rawCardId, format) !== null;
}

/**
 * Convert card reader output to MIT Card API format.
 * Port of hid_to_api() from make-checkin.py:50-59, plus hex reader support.
 * Call isValidCardId() first.
 */
export function hidToApi(rawCardId: string, format: CardReaderFormat): string {
  const kind = classifyCardId(rawCardId, format);

  if (kind === "hexSerial") {
    // The API takes the chip serial number as-is (no byte swap)
    return rawCardId.toUpperCase();
  } else if (kind === "hexCorporate1000") {
    // Raw 35-bit Corporate 1000: 2 parity | 12-bit company | 20-bit card | 1 parity.
    // The API expects the same bits with the parity bits zeroed, matching
    // the "00" + company + card + "0" layout of the 11-digit branch below.
    // Arithmetic rather than bitwise ops, since JS bitwise ops truncate to 32 bits.
    const raw = parseInt(rawCardId, 16);
    const withoutLeadingParity = raw % TWO_POW_33;
    const apiValue = withoutLeadingParity - (withoutLeadingParity % 2);
    return apiValue.toString(16).toUpperCase();
  } else if (rawCardId.length === 11) {
    // Take last 7 digits → 20-bit binary padded + trailing 0
    // Prepend "00110001000110" → convert to hex
    const last7 = rawCardId.slice(-7);
    const num = parseInt(last7, 10);
    const binary20 = num.toString(2).padStart(20, "0");
    const fullBinary = "00110001000110" + binary20 + "0";
    const hexValue = parseInt(fullBinary, 2).toString(16).toUpperCase();
    return hexValue;
  } else {
    // Parse as 32-bit int → byte-swap big-endian to little-endian → hex
    const num = parseInt(rawCardId, 10) >>> 0; // ensure unsigned 32-bit
    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    view.setUint32(0, num, false); // big-endian
    // Read bytes in reverse order (little-endian swap)
    const b0 = view.getUint8(3);
    const b1 = view.getUint8(2);
    const b2 = view.getUint8(1);
    const b3 = view.getUint8(0);
    const swapped = ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
    return swapped.toString(16).toUpperCase();
  }
}
