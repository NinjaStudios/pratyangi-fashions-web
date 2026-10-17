import type { Metadata } from "next";
import { SignupView } from "./SignupView";

export const metadata: Metadata = {
  title: "Create Account | Pratyangi Fashions",
  description: "Create your Pratyangi Fashions account for faster checkout, order tracking and AI try-on.",
};

export default function SignupPage() {
  return <SignupView />;
}
