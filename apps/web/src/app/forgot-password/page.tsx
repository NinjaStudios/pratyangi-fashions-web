import type { Metadata } from "next";
import { ForgotView } from "./ForgotView";

export const metadata: Metadata = {
  title: "Reset Password | Pratyangi Fashions",
  description: "Reset your Pratyangi Fashions password with a code sent to your email or mobile number.",
};

export default function ForgotPasswordPage() {
  return <ForgotView />;
}
