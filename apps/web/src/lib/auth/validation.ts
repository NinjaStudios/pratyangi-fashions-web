/** Input rules shared by the login and signup forms. The server must repeat these checks: the browser is never trusted. */

export const validateEmail = (value: string) => {
  const email = value.trim();
  if (!email) return "Enter your email address";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Enter a valid email address, like name@example.com";
  return "";
};

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

export const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { id: "letter", label: "A letter", test: (value: string) => /[A-Za-z]/.test(value) },
  { id: "number", label: "A number", test: (value: string) => /\d/.test(value) },
] as const;

export const validatePassword = (value: string) => {
  if (!value) return "Create a password";
  const missing = passwordRules.find((rule) => !rule.test(value));
  return missing ? `Password needs: ${missing.label.toLowerCase()}` : "";
};

/** 0 (empty) to 4 (strong). A hint for the meter only; the rules above decide what is accepted. */
export const passwordStrength = (value: string) => {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 14) score++;
  return Math.max(1, score);
};

export const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"] as const;

export const otpLength = 6;
export const validateOtp = (value: string) => {
  if (!value) return "Enter the 6-digit code";
  if (value.length !== otpLength || !/^\d+$/.test(value)) return "The code is 6 digits";
  return "";
};

/** "98765 43210" for display. */
export const formatPhone = (digits: string) => `${digits.slice(0, 5)} ${digits.slice(5)}`.trim();

/** The sign-in and reset boxes take either one: anything with an @ is an email, everything else a mobile number. */
export const isEmail = (value: string) => value.includes("@");
export const validateIdentifier = (value: string) => {
  if (!value.trim()) return "Enter your email or mobile number";
  return isEmail(value) ? validateEmail(value) : validatePhone(value);
};
/** What is sent to the server for an identifier: a lower-case email, or ten digits. */
export const normaliseIdentifier = (value: string) => (isEmail(value) ? value.trim().toLowerCase() : normalisePhone(value));

/** Only follow `?next=` to a page on this site. */
export const safeNext = (value: string | null | undefined) => (value && value.startsWith("/") && !value.startsWith("//") ? value : "/account");
