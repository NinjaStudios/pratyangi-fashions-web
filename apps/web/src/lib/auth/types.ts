/** A signed-in customer, as the rest of the site sees them. */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  /** "google" for an account created with Google that has no password, otherwise "password". */
  provider: "password" | "google";
  picture?: string;
};

export type SignUpInput = { name: string; email: string; password: string };

/** An expected, customer-facing failure (wrong password, email already used...). `field` and `errors` say which inputs it belongs to. */
export class AuthError extends Error {
  constructor(
    message: string,
    public field?: "name" | "email" | "password" | "code",
    /** One message per input, when the server checked several at once. */
    public errors?: Partial<Record<"name" | "email" | "password" | "code", string>>,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Everything the account pages need from an account system. The store API and the opt-in demo both implement it. */
export type AuthClient = {
  signIn(email: string, password: string): Promise<AuthUser>;
  signUp(input: SignUpInput): Promise<AuthUser>;
  /** `credential` is the Google ID token (a JWT) handed over by Google Identity Services. */
  signInWithGoogle(credential: string): Promise<AuthUser>;
  /** Emails a 6-digit code. The answer is the same whether or not the email has an account. */
  startPasswordReset(email: string): Promise<void>;
  /** Checks the code and sets the new password; the customer then signs in again. */
  finishPasswordReset(input: { email: string; code: string; password: string }): Promise<void>;
  signOut(): Promise<void>;
  /** The signed-in user the server remembers, or null. */
  current(): Promise<AuthUser | null>;
};
