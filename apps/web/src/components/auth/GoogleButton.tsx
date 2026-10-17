"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Auth.module.css";

type GoogleButtonProps = {
  /** "signin_with" or "signup_with": which wording Google puts on its own button. */
  text: "signin_with" | "signup_with" | "continue_with";
  clientId: string;
  /** Called with the Google ID token (a JWT) when the visitor has chosen an account. */
  onCredential: (credential: string) => void;
  /** Called when Google sign-in cannot start (no client ID yet, or the script is blocked). */
  onUnavailable: (message: string) => void;
  disabled?: boolean;
};

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void; ux_mode?: string }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const scriptSrc = "https://accounts.google.com/gsi/client";
let scriptPromise: Promise<void> | null = null;
const loadGoogleScript = () => {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Google script blocked"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

export function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * "Continue with Google" using Google Identity Services.
 *  - With a client ID (NEXT_PUBLIC_GOOGLE_CLIENT_ID) Google draws its own official button here and returns an ID token,
 *    which the server verifies (the browser never decides who someone is).
 *  - Without one, a button of the same look is shown that explains what is still to be set up.
 */
export function GoogleButton({ text, clientId, onCredential, onUnavailable, disabled }: GoogleButtonProps) {
  const holder = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onCredential, onUnavailable });
  callbacks.current = { onCredential, onUnavailable };
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!clientId || !holder.current) return;
    let cancelled = false;
    const node = holder.current;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) callbacks.current.onCredential(response.credential);
            else callbacks.current.onUnavailable("Google did not return a sign-in. Please try again.");
          },
        });
        node.innerHTML = "";
        window.google.accounts.id.renderButton(node, { type: "standard", theme: "outline", size: "large", text, shape: "rectangular", logo_alignment: "center", width: Math.min(400, Math.max(200, node.clientWidth)) });
        setRendered(true);
      })
      .catch(() => callbacks.current.onUnavailable("Google sign-in could not load. Check your connection or ad blocker and try again."));
    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (clientId) {
    return (
      <div className={styles.googleWrap} aria-busy={!rendered}>
        <div ref={holder} className={styles.googleHolder} />
        {!rendered && <span className={styles.googleLoading}>Loading Google…</span>}
      </div>
    );
  }

  const label = text === "signup_with" ? "Sign up with Google" : text === "signin_with" ? "Sign in with Google" : "Continue with Google";
  return (
    <button
      type="button"
      className={styles.google}
      disabled={disabled}
      onClick={() => onUnavailable("Google sign-in is not switched on yet. It needs a Google client ID (see docs/BACKEND_PLAN.md, “Sign in with Google”).")}
    >
      <GoogleLogo />
      <span>{label}</span>
    </button>
  );
}
