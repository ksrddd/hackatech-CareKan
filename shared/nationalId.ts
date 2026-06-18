// Thai national ID (เลขบัตรประจำตัวประชาชน) validation — shared by frontend + backend.
// No runtime deps so both sides import the exact same rule.

/**
 * Full validity check: exactly 13 digits AND the official mod-11 check digit.
 * The 13th digit is derived from the first 12:
 *   sum   = Σ digit[i] × (13 − i)   for i = 0..11
 *   check = (11 − (sum mod 11)) mod 10
 * Returns false for wrong length, non-digit characters, or a bad check digit.
 */
export function isThaiNationalId(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(id[i]) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return check === Number(id[12]);
}
