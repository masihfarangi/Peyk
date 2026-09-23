/**
 * Validation for the login/signup forms. Dependency-free and specific to
 * this page, same as the rest of the app's small, self-contained utils.
 */

export function validateFullName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'نام و نام خانوادگی را وارد کنید';
  if (trimmed.length < 3) return 'نام و نام خانوادگی را کامل وارد کنید';
  if (!/\s/.test(trimmed)) return 'نام و نام خانوادگی را کامل وارد کنید';
  return null;
}

/**
 * Validates just the local part of the phone number — the +98 country code
 * is fixed and rendered separately, never part of what the user types.
 * A valid Iranian mobile is 11 digits starting with 0 (e.g. 09123456789);
 * dropping the leading 0 for the +98 form leaves 10 digits starting with 9.
 */
export function validatePhoneLocal(value: string): string | null {
  if (!value) return 'شماره تماس را وارد کنید';
  if (!/^9\d{9}$/.test(value)) return 'شماره تماس معتبر وارد کنید';
  return null;
}

/**
 * The standard Iranian national-ID (کد ملی) checksum: reject any 10-digit
 * string of a single repeated digit, then verify the 10th digit against a
 * weighted checksum of the first nine.
 */
export function validateNationalId(value: string): string | null {
  if (!value) return 'کد ملی را وارد کنید';
  if (!/^\d{10}$/.test(value)) return 'کد ملی باید ۱۰ رقم باشد';
  if (/^(\d)\1{9}$/.test(value)) return 'کد ملی معتبر نیست';

  const digits = value.split('').map(Number);
  const checkDigit = digits[9];
  const sum = digits.slice(0, 9).reduce((total, digit, index) => total + digit * (10 - index), 0);
  const remainder = sum % 11;
  const expected = remainder < 2 ? remainder : 11 - remainder;

  return checkDigit === expected ? null : 'کد ملی معتبر نیست';
}

export function validateOtp(value: string): string | null {
  if (!value) return 'کد را وارد کنید';
  if (!/^\d{4}$/.test(value)) return 'کد ۴ رقمی را کامل وارد کنید';
  return null;
}

export function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}
