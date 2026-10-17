import type { Metadata } from "next";
import { LoginView } from "./LoginView";

export const metadata: Metadata = {
  title: "Sign In | Pratyangi Fashions",
  description: "Sign in to your Pratyangi Fashions account to track orders, save addresses and try sarees on with AI.",
};

export default function LoginPage() {
  return <LoginView />;
}
