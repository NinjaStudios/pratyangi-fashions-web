import type { Metadata } from "next";
import { BagView } from "./BagView";

export const metadata: Metadata = {
  title: "Your Bag | Pratyangi Fashions",
  description: "Review the handwoven sarees in your Pratyangi Fashions bag.",
};

export default function BagPage() {
  return <BagView />;
}
