import type { Metadata } from "next";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = {
  title: "Checkout | Pratyangi Fashions",
  description: "Choose your delivery address and delivery option, then review your Pratyangi Fashions order.",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
