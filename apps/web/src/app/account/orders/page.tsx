import type { Metadata } from "next";
import { OrdersView } from "@/components/account/OrdersView";

export const metadata: Metadata = {
  title: "My Orders | Pratyangi Fashions",
  description: "Track, return or buy again from your past Pratyangi Fashions orders.",
};

export default function OrdersPage() {
  return <OrdersView />;
}
