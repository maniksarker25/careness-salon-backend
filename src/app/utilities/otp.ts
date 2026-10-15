// Single source of truth for OTP lifetime. The emails tell users the code
// "Expires in 10 minutes", so every place that issues or checks a code must
// use this value.
export const OTP_EXPIRY_MINUTES = 10;

// Unverified accounts are only cleaned up this long AFTER their code expired,
// so a late verify attempt gets "code is expired" (and can resend a code)
// instead of "user not found".
export const UNVERIFIED_USER_CLEANUP_GRACE_MINUTES = 60;

export const getOtpExpiryDate = (): Date =>
  new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
