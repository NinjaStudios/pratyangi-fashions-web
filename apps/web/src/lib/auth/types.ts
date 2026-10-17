/** A signed-in customer, as the rest of the site sees them. */
export type AuthUser = {
  id: string;
  name: string;
  /** Ten digits, no +91. Present when they signed in with their mobile number. */
  phone?: string;
  /** Present when they signed in with Google. */
  email?: string;
  /** How they signed in. */
  provider: "phone" | "google";
  picture?: string;
};

/** What the server says after a one-time code has been sent. `isNew` = no account with this number yet. */
export type OtpSent = { isNew: boolean };

export type VerifyOtpInput = {
  /** Ten digits, no +91. */
  phone: string;
  /** The six digits from the SMS. */
  code: string;
  /** Needed only for a number with no account yet (`isNew`). */
  name?: string;
};

/** An expected, user-facing failure (wrong code, missing name...). `field` says which input it belongs to. */
export class AuthError extends Error {
  constructor(message: string, public field?: "name" | "phone" | "code") {
    super(message);
    this.name = "AuthError";
  }
}

/** Everything the login and signup pages need from an account system. The demo and the real API both implement it. */
export type AuthClient = {
  /** Texts a six-digit code to the number. Signing in and creating an account are the same flow: the code proves the number. */
  sendOtp(phone: string): Promise<OtpSent>;
  /** Checks the code and signs in, creating the account first when the number is new. */
  verifyOtp(input: VerifyOtpInput): Promise<AuthUser>;
  /** `credential` is the Google ID token (a JWT) handed over by Google Identity Services. */
  signInWithGoogle(credential: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  /** The signed-in user the server (or demo storage) remembers, or null. */
  current(): Promise<AuthUser | null>;
};
