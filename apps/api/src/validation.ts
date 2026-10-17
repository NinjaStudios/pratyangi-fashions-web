import { z } from "zod";
import { HttpError } from "./errors.js";

/**
 * Every rule the website checks in the browser is checked again here: the browser is never trusted.
 * Each message is written for the customer, because it is shown next to the field as it is.
 */

export const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

/** Indian mobile numbers: ten digits starting 6-9. A leading +91, 91 or 0 and any spaces or dashes are ignored. */
export const normalisePhone = (value: string) => value.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");

const required = (message: string) => z.string({ error: message }).trim().min(1, { error: message });

export const emailField = z
  .string({ error: "Enter your email address." })
  .trim()
  .toLowerCase()
  .min(1, { error: "Enter your email address." })
  .max(254, { error: "That email address is too long." })
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, { error: "Enter a valid email address, like name@example.com." });

export const nameField = z
  .string({ error: "Enter your full name." })
  .trim()
  .min(2, { error: "Enter your full name (at least 2 characters)." })
  .max(80, { error: "That name is too long (80 characters at most)." });

export const newPasswordField = z
  .string({ error: "Create a password." })
  .min(8, { error: "Password must be at least 8 characters." })
  .max(128, { error: "Password is too long (128 characters at most)." })
  .regex(/[A-Za-z]/, { error: "Password needs at least one letter." })
  .regex(/\d/, { error: "Password needs at least one number." });

export const signupSchema = z.object({ name: nameField, email: emailField, password: newPasswordField });
export const loginSchema = z.object({ email: emailField, password: required("Enter your password.") });
export const googleSchema = z.object({ credential: required("Google did not send a sign-in token. Please try again.") });
export const forgotSchema = z.object({ email: emailField });
export const verifyEmailSchema = z.object({ token: z.string({ error: "This verification link is incomplete." }).trim().min(20, { error: "This verification link is incomplete." }).max(200, { error: "This verification link is incomplete." }) });
export const resetSchema = z.object({
  email: emailField,
  code: z.string({ error: "Enter the 6-digit code." }).trim().regex(/^\d{6}$/, { error: "The code is 6 digits." }),
  password: newPasswordField,
});

const phoneField = z
  .string({ error: "Enter the delivery mobile number." })
  .transform(normalisePhone)
  .refine((digits) => digits.length > 0, { error: "Enter the delivery mobile number." })
  .refine((digits) => /^[6-9]\d{9}$/.test(digits), { error: "Enter a valid 10-digit mobile number that starts with 6, 7, 8 or 9." });

export const addressSchema = z.object({
  type: z.enum(["Home", "Office", "Other"], { error: "Choose Home, Office or Other." }),
  label: z.string().trim().max(30, { error: "The label is too long (30 characters at most)." }).default(""),
  name: z.string({ error: "Enter the recipient's full name." }).trim().min(2, { error: "Enter the recipient's full name (at least 2 characters)." }).max(80, { error: "That name is too long (80 characters at most)." }),
  phone: phoneField,
  alternatePhone: z
    .string()
    .optional()
    .transform((value) => (value ? normalisePhone(value) : ""))
    .refine((digits) => digits === "" || /^[6-9]\d{9}$/.test(digits), { error: "Enter a valid 10-digit alternate number that starts with 6, 7, 8 or 9, or leave it empty." })
    .transform((digits) => digits || undefined),
  house: z.string({ error: "Enter the house, flat or building number." }).trim().min(1, { error: "Enter the house, flat or building number." }).max(120, { error: "That is too long (120 characters at most)." }),
  street: z.string({ error: "Enter the street, area or landmark." }).trim().min(1, { error: "Enter the street, area or landmark." }).max(160, { error: "That is too long (160 characters at most)." }),
  city: z.string({ error: "Enter the city." }).trim().min(2, { error: "Enter the city." }).max(60, { error: "That city name is too long." }),
  state: z.string({ error: "Choose the state." }).refine((value) => (indianStates as readonly string[]).includes(value), { error: "Choose the state from the list." }),
  pincode: z.string({ error: "Enter the 6-digit PIN code." }).trim().regex(/^[1-9]\d{5}$/, { error: "Enter a valid 6-digit PIN code (it cannot start with 0)." }),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

/** Checks `body` against `schema`; on failure throws a 422 that carries one message per field. */
export function parse<T extends z.ZodType>(schema: T, body: unknown): z.output<T> {
  const result = schema.safeParse(body ?? {});
  if (result.success) return result.data;
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  const [field] = Object.keys(errors);
  throw new HttpError(422, errors[field ?? "form"] ?? "Please check the details and try again.", field, errors);
}
