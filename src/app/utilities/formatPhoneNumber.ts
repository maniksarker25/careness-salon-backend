/**
 * Normalizes a phone number before it is persisted.
 *
 * Strips spaces/dashes/parentheses, and for German numbers (+49 country code)
 * drops the national trunk "0" that sometimes gets typed/pasted along with
 * the country code (e.g. "+49 0152 59754290" -> "+4915259754290").
 */
const formatPhoneNumber = (phoneNumber?: string | null) => {
  if (!phoneNumber) {
    return phoneNumber;
  }

  const cleaned = phoneNumber.replace(/[\s()-]/g, '');

  if (/^\+490\d+$/.test(cleaned)) {
    return cleaned.replace(/^\+490/, '+49');
  }

  return cleaned;
};

export default formatPhoneNumber;
