import type { Metadata } from "next";
import { NewArrivalsView } from "./NewArrivalsView";

export const metadata: Metadata = {
  title: "New Arrivals | Pratyangi Fashions",
  description: "Discover the latest additions to the Pratyangi Fashions collection of handwoven silk sarees.",
};

export default function NewArrivalsPage() {
  return <NewArrivalsView />;
}
