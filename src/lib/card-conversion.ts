/**
 * Convert HID card reader output to MIT Card API format.
 * Port of hid_to_api() from make-checkin.py:50-59.
 */
export function hidToApi(rawCardId: string): string {
  if (rawCardId.length === 11) {
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
