import type { Customer } from "@prisma/client";
import type { Config } from "../config.js";
import { isUniqueViolation, type Db } from "../db.js";
import { HttpError, badRequest, conflict, unauthorized, unavailable } from "../errors.js";
import type { Mailer } from "../mailer.js";
import { hashPassword, verifyAgainstDecoy, verifyPassword } from "../security/password.js";
import { newCode, newSessionToken, safeEqualHex, sha256 } from "../security/tokens.js";
import type { GoogleVerifier } from "./google.js";
import { toPublicCustomer, type PublicCustomer, type SessionStore } from "./sessions.js";

type Started = { customer: PublicCustomer; token: string; expiresAt: Date };

const resetMinutes = 10;
const maxResetAttempts = 5;
const verificationHours = 24;
const wrongLogin = "The email or password is incorrect.";
const hour = 60 * 60 * 1000;

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService(deps: { db: Db; config: Config; sessions: SessionStore; mailer: Mailer | null; google: GoogleVerifier | null; log?: (message: string, error: unknown) => void }) {
  const { db, config, sessions, mailer, google } = deps;

  const byEmail = (email: string) => db.customer.findUnique({ where: { email } });

  const start = async (customer: Customer, userAgent: string | undefined): Promise<Started> => {
    const { token, expiresAt } = await sessions.create(customer.id, userAgent);
    return { customer: toPublicCustomer(customer), token, expiresAt };
  };

  /** Emails a verification link. Returns false when no email service is configured (nothing is pretended). */
  const sendVerificationEmail = async (customer: Customer): Promise<boolean> => {
    if (!mailer) return false;
    const token = newSessionToken();
    await db.emailVerification.deleteMany({ where: { customerId: customer.id } });
    await db.emailVerification.create({ data: { customerId: customer.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + verificationHours * hour) } });
    const link = `${config.webUrl}/verify-email?token=${token}`;
    await mailer.send(
      customer.email,
      "Confirm your email for Pratyangi Fashions",
      `Hello ${customer.name.split(" ")[0]},\n\nPlease confirm your email address by opening this link (it works for ${verificationHours} hours):\n\n${link}\n\nIf you did not create an account, you can ignore this email.`,
    );
    return true;
  };

  return {
    /** Email + password signup. One account per email address, whichever way it was first created. */
    async signUp(input: { name: string; email: string; password: string }, userAgent?: string): Promise<Started & { verificationEmailSent: boolean }> {
      const existing = await byEmail(input.email);
      if (existing) {
        throw conflict(
          existing.passwordHash
            ? "An account with this email already exists. Please sign in instead."
            : "This email is already registered through Google. Please use Continue with Google.",
          "email",
        );
      }
      const passwordHash = await hashPassword(input.password);
      let customer: Customer;
      try {
        customer = await db.customer.create({ data: { name: input.name, email: input.email, passwordHash } });
      } catch (error) {
        // two signups with the same email at the same moment: the UNIQUE key lets exactly one through
        if (isUniqueViolation(error)) throw conflict("An account with this email already exists. Please sign in instead.", "email");
        throw error;
      }
      let verificationEmailSent = false;
      try {
        verificationEmailSent = await sendVerificationEmail(customer);
      } catch (error) {
        // the account exists either way; the customer can ask for another link from their account
        deps.log?.("could not send the verification email", error);
      }
      return { ...(await start(customer, userAgent)), verificationEmailSent };
    },

    async signIn(input: { email: string; password: string }, userAgent?: string): Promise<Started> {
      const customer = await byEmail(input.email);
      if (!customer) {
        await verifyAgainstDecoy(input.password);
        throw unauthorized(wrongLogin);
      }
      if (!customer.passwordHash) {
        throw unauthorized("This account signs in with Google. Please use Continue with Google, or choose Forgot password to add a password.");
      }
      if (!(await verifyPassword(customer.passwordHash, input.password))) throw unauthorized(wrongLogin);
      return start(customer, userAgent);
    },

    /**
     * "Continue with Google". A first-time Google user gets an account; a returning one signs in to the same account, found by
     * Google's stable user id, and otherwise by the (Google-verified) email so one email never becomes two accounts.
     */
    async signInWithGoogle(credential: string, userAgent?: string): Promise<Started> {
      if (!google) throw unavailable("Google sign-in is not set up on the server yet.");
      let profile;
      try {
        profile = await google(credential);
      } catch {
        throw unauthorized("Google sign-in could not be verified. Please try again.");
      }
      const email = profile.email.trim().toLowerCase(); // the unique key is on the lower-case form
      if (!profile.emailVerified) throw unauthorized("Your Google email address is not verified, so we cannot sign you in with it.");

      try {
        const customer = await db.$transaction(async (tx) => {
          const linked = await tx.customerIdentity.findUnique({ where: { provider_providerUserId: { provider: "google", providerUserId: profile.sub } }, include: { customer: true } });
          if (linked) return linked.customer;

          const existing = await tx.customer.findUnique({ where: { email } });
          if (existing) {
            await tx.customerIdentity.create({ data: { customerId: existing.id, provider: "google", providerUserId: profile.sub } });
            if (existing.emailVerifiedAt) return existing;
            // Someone may have registered this address with a password before its owner ever proved it. Google has now proved
            // the owner, so that password is thrown away and any session opened with it ends.
            await tx.session.deleteMany({ where: { customerId: existing.id } });
            return tx.customer.update({ where: { id: existing.id }, data: { emailVerifiedAt: new Date(), passwordHash: null } });
          }

          const name = profile.name?.trim().slice(0, 80) || email.split("@")[0] || "Customer";
          return tx.customer.create({
            data: { name, email, emailVerifiedAt: new Date(), pictureUrl: profile.picture ?? null, identities: { create: { provider: "google", providerUserId: profile.sub } } },
          });
        });
        return await start(customer, userAgent);
      } catch (error) {
        if (isUniqueViolation(error)) throw conflict("This Google account is already linked. Please try again.");
        throw error;
      }
    },

    /** Marks the email as verified when the link's token is valid, unused and unexpired. */
    async verifyEmail(token: string): Promise<{ customer: PublicCustomer }> {
      const record = await db.emailVerification.findFirst({ where: { tokenHash: sha256(token), expiresAt: { gt: new Date() } }, include: { customer: true } });
      if (!record) throw new HttpError(400, "This verification link is invalid, has expired or was already used. If your email is not verified yet, sign in and request a new link.", "token");
      const customer = record.customer.emailVerifiedAt ? record.customer : await db.customer.update({ where: { id: record.customerId }, data: { emailVerifiedAt: new Date() } });
      await db.emailVerification.deleteMany({ where: { customerId: record.customerId } });
      return { customer: toPublicCustomer(customer) };
    },

    /** Sends a fresh verification link to a signed-in customer whose email is not verified yet. */
    async resendVerification(customerId: number): Promise<{ alreadyVerified: boolean }> {
      const customer = await db.customer.findUnique({ where: { id: customerId } });
      if (!customer) throw unauthorized();
      if (customer.emailVerifiedAt) return { alreadyVerified: true };
      if (!mailer) throw unavailable("Email verification is not set up on the server yet, so we cannot send a link right now.");
      await sendVerificationEmail(customer);
      return { alreadyVerified: false };
    },

    /** Emails a six-digit code. Answers the same way whether or not the email has an account. */
    async requestPasswordReset(email: string): Promise<void> {
      if (!mailer) throw unavailable("Password reset by email is not set up on the server yet.");
      const customer = await byEmail(email);
      if (!customer) return;
      const code = newCode();
      await db.passwordReset.deleteMany({ where: { customerId: customer.id } });
      await db.passwordReset.create({ data: { customerId: customer.id, codeHash: sha256(code), expiresAt: new Date(Date.now() + resetMinutes * 60_000) } });
      await mailer.send(
        email,
        "Your Pratyangi Fashions password reset code",
        `Your code is ${code}. It works for ${resetMinutes} minutes.\n\nIf you did not ask to reset your password, you can ignore this email.`,
      );
    },

    /** Checks the code and sets the new password. Every session of that customer ends, so they sign in again. */
    async resetPassword(input: { email: string; code: string; password: string }): Promise<void> {
      const invalid = () => new HttpError(400, "That code is not correct or has expired. Please request a new one.", "code");
      const customer = await byEmail(input.email);
      if (!customer) throw invalid();
      const reset = await db.passwordReset.findFirst({ where: { customerId: customer.id, expiresAt: { gt: new Date() } }, orderBy: { id: "desc" } });
      if (!reset) throw invalid();
      if (reset.attempts >= maxResetAttempts) {
        await db.passwordReset.delete({ where: { id: reset.id } });
        throw badRequest("Too many wrong codes. Please request a new one.", "code");
      }
      if (!safeEqualHex(reset.codeHash, sha256(input.code))) {
        await db.passwordReset.update({ where: { id: reset.id }, data: { attempts: { increment: 1 } } });
        throw new HttpError(400, "That code is not correct. Please check it and try again.", "code");
      }
      const passwordHash = await hashPassword(input.password);
      await db.$transaction([
        db.customer.update({ where: { id: customer.id }, data: { passwordHash, emailVerifiedAt: customer.emailVerifiedAt ?? new Date() } }),
        db.passwordReset.deleteMany({ where: { customerId: customer.id } }),
        db.session.deleteMany({ where: { customerId: customer.id } }),
      ]);
    },
  };
}
