/** A signed-in customer, as the rest of the site sees them. */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  /** How they signed in. */
  provider: "password" | "google";
  picture?: string;
};

export type SignUpInput = { name: string; email: string; phone: string; password: string };

/** An expected, user-facing failure (wrong password, email already used...). `field` says which input it belongs to. */
export class AuthError extends Error {
  constructor(message: string, public field?: "name" | "email" | "phone" | "password") {
    super(message);
    this.name = "AuthError";
  }
}

/** Everything the login and signup pages need from an account system. The demo and the real API both implement it. */
export type AuthClient = {
  signIn(email: string, password: string): Promise<AuthUser>;
  signUp(input: SignUpInput): Promise<AuthUser>;
  /** `credential` is the Google ID token (a JWT) handed over by Google Identity Services. */
  signInWithGoogle(credential: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  /** The signed-in user the server (or demo storage) remembers, or null. */
  current(): Promise<AuthUser | null>;
};
