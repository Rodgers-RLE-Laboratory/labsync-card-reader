/**
 * Readers output one of two formats:
 * - Decimal digits (e.g. OmniKey 5427CK), 5-15 digits
 * - Hex of the raw 35-bit HID Corporate 1000 credential, 9-10 chars
 *   (e.g. "0788c724ce"). MIT's company code (3142) always puts a "C" or
 *   "D" in this output, so all-digit strings are treated as decimal.
 */
const DECIMAL_CARD_ID = /^\d{5,15}$/;
const HEX_CARD_ID = /^(?=.*[a-f])[0-9a-f]{9,10}$/i;
const TWO_POW_33 = 2 ** 33;
const TWO_POW_35 = 2 ** 35;

function isHexCardId(rawCardId: string): boolean {
  // Must also fit in 35 bits (Corporate 1000 format)
  return HEX_CARD_ID.test(rawCardId) && parseInt(rawCardId, 16) < TWO_POW_35;
}

export function isValidCardId(rawCardId: string): boolean {
  return DECIMAL_CARD_ID.test(rawCardId) || isHexCardId(rawCardId);
}

/**
 * Convert card reader output to MIT Card API format.
 * Port of hid_to_api() from make-checkin.py:50-59, plus hex reader support.
 */
export function hidToApi(rawCardId: string): string {
  if (isHexCardId(rawCardId)) {
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
