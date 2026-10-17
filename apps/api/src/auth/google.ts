import { OAuth2Client } from "google-auth-library";

export type GoogleProfile = { sub: string; email: string; emailVerified: boolean; name?: string; picture?: string };
export type GoogleVerifier = (credential: string) => Promise<GoogleProfile>;

/**
 * Checks a Google ID token the way Google documents it: signature, expiry, issuer and that it was issued for OUR client ID.
 * The client ID is public; there is no client secret in this flow, so nothing secret ever reaches the browser.
 * Returns null when GOOGLE_CLIENT_ID is not set.
 */
export function createGoogleVerifier(clientId: string | undefined): GoogleVerifier | null {
  if (!clientId) return null;
  const client = new OAuth2Client(clientId);
  return async (credential) => {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) throw new Error("Google token has no subject or email");
    return { sub: payload.sub, email: payload.email.toLowerCase(), emailVerified: payload.email_verified === true, name: payload.name, picture: payload.picture };
  };
}
