/** Input rules shared by the login and signup forms. The server must repeat these checks: the browser is never trusted. */

export const validateName = (value: string) => {
  const name = value.trim();
  if (name.length < 2) return "Enter your full name";
  if (name.length > 80) return "That name is too long";
  return "";
};

/** Indian mobile numbers: ten digits starting with 6, 7, 8 or 9 (a leading +91 or 0 is ignored). */
export const normalisePhone = (value: string) => value.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
export const validatePhone = (value: string) => {
  const digits = normalisePhone(value);
  if (!digits) return "Enter your mobile number";
  if (!/^[6-9]\d{9}$/.test(digits)) return "Enter a valid 10-digit mobile number";
  return "";
};

export const otpLength = 6;
export const validateOtp = (value: string) => {
  if (!value) return "Enter the 6-digit code";
  if (value.length !== otpLength || !/^\d+$/.test(value)) return "The code is 6 digits";
  return "";
};

/** "98765 43210" for display. */
export const formatPhone = (digits: string) => `${digits.slice(0, 5)} ${digits.slice(5)}`.trim();

/** Only follow `?next=` to a page on this site. */
export const safeNext = (value: string | null | undefined) => (value && value.startsWith("/") && !value.startsWith("//") ? value : "/account");
