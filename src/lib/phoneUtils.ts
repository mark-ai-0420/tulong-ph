/**
 * TulongPH - Phone Utilities
 * Robust extraction and parsing of Philippine telephone numbers for tel: links and UI call chips.
 */

export interface PhoneNumberOption {
  label: string;
  dialable: string;
}

/**
 * Normalizes and extracts a single dialable number from a candidate phone string.
 * Strips extensions, ranges, and non-dialable annotations.
 */
function cleanSingleNumber(str: string): string {
  if (!str) return '';

  // 1. Remove 24/7 or hour indicators so digits like '24/7' do not contaminate the phone number
  let s = str.replace(/24\s*[/x]\s*7/gi, ' ').replace(/24\s*hours?/gi, ' ');

  // 2. Strip extensions, trunkline local ranges, or suffixes:
  // e.g. 'loc. 1113-1114', 'local 555', 'ext. 102', 'extension 4', 'line 2', 'to 76', '#123'
  s = s.replace(
    /(?:\((?:loc(?:al|\.)?|ext(?:ension|\.)?|line|to|\bx)[^)]*\)|(?:(?:\bloc(?:al|\.)?|\bext(?:ension|\.)?|\blines?|\btrunkline|\bto|\bx)\s*[:#]?\s*\d+.*))$/i,
    ''
  );

  // 3. Extract purely digits
  let digits = s.replace(/[^0-9]/g, '');
  if (!digits) return '';

  // 4. Handle international +63 or 63 prefix:
  // e.g. 639xxxxxxxxx (12 digits) -> 09xxxxxxxxx
  // e.g. 6328xxxxxxx (11 digits) -> 028xxxxxxx
  if (digits.startsWith('63') && (digits.length === 11 || digits.length === 12)) {
    digits = '0' + digits.slice(2);
  }

  // 5. Handle 8-digit Metro Manila landlines (NTC 8-digit migration format starting with 3, 5, 7, 8)
  // Ensures mobile dialers correctly route to the NCR 02 area code without failure
  if (digits.length === 8 && /^[3578]/.test(digits)) {
    digits = '02' + digits;
  }

  // 6. Validation for valid Philippine phone numbers:
  // - Emergency/Government shortcodes: 3 to 5 digits (911, 1343, 1348, 1555, 8888, 16533)
  // - Provincial landlines without area code: 7 digits
  // - Standard landlines with area code: 10 digits (e.g. 028xxxxxxx, 045xxxxxxx)
  // - Mobile numbers: 11 digits (09xxxxxxxxx)
  // Rejects invalid fragments like '76' (from 'to 76') or concatenated 28-digit strings
  if (digits.length < 3 || digits.length > 12) {
    return '';
  }

  return digits;
}

/**
 * Extracts a single valid dialable telephone number for tel: links.
 *
 * Rules:
 * - If the string contains multiple numbers separated by '/', 'to', ',', or 'or',
 *   extracts the first valid telephone number.
 * - If the string contains an extension (e.g. 'loc. 1113-1114'), extracts the base
 *   switchboard number (e.g. '(02) 8552-6601' -> '0285526601'), preventing invalid
 *   28-digit concatenated numbers.
 * - Handles mobile numbers: '09xx-xxx-xxxx' -> '09xxxxxxxxx'
 * - Handles landlines: '(02) 8xxx-xxxx' -> '028xxxxxxx'
 * - Handles shortcodes: '1343', '8888', '911', '165-33' -> '1343', '8888', '911', '16533'
 */
export function parseDialableNumber(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  // Split on separators that indicate multiple numbers or options
  const parts = raw.split(/(?:\r?\n|\s*\/\s*|\s*;\s*|\s+or\s+|\s+to\s+|,)/i);
  for (const part of parts) {
    const num = cleanSingleNumber(part);
    if (num) return num;
  }

  return cleanSingleNumber(raw);
}

/**
 * Splits multi-line or multi-line-channel phone strings into individual call options
 * if an agency has multiple distinct phone lines (e.g. landline and mobile).
 */
export function splitPhoneNumbers(raw: string): PhoneNumberOption[] {
  if (!raw || typeof raw !== 'string') return [];

  // Split on primary phone line separators:
  // newlines, slashes, semicolons, 'or', and commas followed by phone number patterns
  const rawParts = raw.split(/(?:\r?\n|\s*\/\s*|\s*;\s*|\s+or\s+|,\s*(?=(?:\+?63|0|\(?0?[2-9]\)?)))/i);
  const results: PhoneNumberOption[] = [];
  const seen = new Set<string>();

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const dialable = cleanSingleNumber(trimmed);
    if (!dialable || seen.has(dialable)) continue;
    seen.add(dialable);

    // Format display label cleanly
    let label = trimmed;
    // If it is an 8-digit number without area code in label, format as (02) xxxx-xxxx
    if (/^[3578]\d{3}[-\s]?\d{4}$/.test(trimmed)) {
      label = `(02) ${trimmed}`;
    }

    results.push({ label, dialable });
  }

  return results;
}
