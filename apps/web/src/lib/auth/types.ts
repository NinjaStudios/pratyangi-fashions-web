/** A signed-in customer, as the rest of the site sees them. */
export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  /** Ten digits, no +91. */
  phone?: string;
  /** How they signed in. */
  provider: "password" | "google";
  picture?: string;
};

export type SignUpInput = { name: string; email: string; /** Ten digits, no +91. */ phone: string; password: string };

/** Which of the two codes at signup (or which resend) we are talking about. */
export type CodeChannel = "phone" | "email";

/** The server has texted a code to the mobile and emailed one to the address; `signupId` ties the two steps together. */
export type SignupStarted = { signupId: string };

export type SignupVerifyInput = { signupId: string; phoneCode: string; emailCode: string };

/** A password-reset code was sent. `sentTo` is a masked address or number, for display ("m***@gmail.com"). */
export type ResetStarted = { resetId: string; sentTo: string };

/** An expected, user-facing failure (wrong code, number already used...). `field` says which input it belongs to. */
export class AuthError extends Error {
  constructor(message: string, public field?: "name" | "email" | "phone" | "password" | "identifier" | "code" | "phoneCode" | "emailCode") {
    super(message);
    this.name = "AuthError";
  }
}

/** Everything the account pages need from an account system. The demo and the real API both implement it. */
export type AuthClient = {
  /** `identifier` is an email address or a 10-digit mobile number. */
  signIn(identifier: string, password: string): Promise<AuthUser>;

  /** Checks the details, then sends a code to the mobile and one to the email. No account exists until `verifySignup` passes. */
  startSignup(input: SignUpInput): Promise<SignupStarted>;
  resendSignupCode(signupId: string, channel: CodeChannel): Promise<void>;
  /** Both codes must be right; then the account is created and signed in. */
  verifySignup(input: SignupVerifyInput): Promise<AuthUser>;

  /** Sign in with a code texted to the mobile, for people who would rather not type a password. Existing accounts only. */
  sendLoginCode(phone: string): Promise<void>;
  verifyLoginCode(phone: string, code: string): Promise<AuthUser>;

  /** Always answers the same way, whether or not the account exists, so the form never reveals who has one. */
  startPasswordReset(identifier: string): Promise<ResetStarted>;
  finishPasswordReset(input: { resetId: string; code: string; password: string }): Promise<void>;

  /** `credential` is the Google ID token (a JWT) handed over by Google Identity Services. */
  signInWithGoogle(credential: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  /** The signed-in user the server (or demo storage) remembers, or null. */
  current(): Promise<AuthUser | null>;
};
