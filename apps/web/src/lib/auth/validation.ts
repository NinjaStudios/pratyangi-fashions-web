/**
 * Input rules shared by the login, signup and reset forms. They give instant feedback in the browser; the store API checks
 * the same rules again (apps/api/src/validation.ts) and the wording is kept the same, so a message reads the same wherever it comes from.
 */

export const validateEmail = (value: string) => {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (email.length > 254) return "That email address is too long.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Enter a valid email address, like name@example.com.";
  return "";
};

export const validateName = (value: string) => {
  const name = value.trim();
  if (!name) return "Enter your full name.";
  if (name.length < 2) return "Enter your full name (at least 2 characters).";
  if (name.length > 80) return "That name is too long (80 characters at most).";
  return "";
};

export const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { id: "letter", label: "A letter", test: (value: string) => /[A-Za-z]/.test(value) },
  { id: "number", label: "A number", test: (value: string) => /\d/.test(value) },
] as const;

export const validatePassword = (value: string) => {
  if (!value) return "Create a password.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (value.length > 128) return "Password is too long (128 characters at most).";
  if (!/[A-Za-z]/.test(value)) return "Password needs at least one letter.";
  if (!/\d/.test(value)) return "Password needs at least one number.";
  return "";
};

export const validateConfirm = (password: string, confirm: string) => {
  if (!confirm) return "Re-enter your password.";
  return confirm === password ? "" : "The two passwords do not match.";
};

export const otpLength = 6;
export const validateCode = (value: string) => {
  if (!value) return "Enter the 6-digit code.";
  if (value.length !== otpLength || !/^\d+$/.test(value)) return "The code is 6 digits.";
  return "";
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

/** Only follow `?next=` to a page on this site. */
export const safeNext = (value: string | null | undefined) => (value && value.startsWith("/") && !value.startsWith("//") ? value : "/account");
