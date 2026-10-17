import type { Metadata } from "next";
import { VerifyEmailView } from "./VerifyEmailView";

export const metadata: Metadata = {
  title: "Verify Email | Pratyangi Fashions",
  description: "Confirm your email address for your Pratyangi Fashions account.",
};

export default function VerifyEmailPage() {
  return <VerifyEmailView />;
}
