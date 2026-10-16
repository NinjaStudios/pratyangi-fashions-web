import type { Metadata } from "next";
import { AccountOverview } from "@/components/account/AccountOverview";

export const metadata: Metadata = {
  title: "My Account | Pratyangi Fashions",
  description: "Manage your Pratyangi Fashions orders, addresses and more.",
};

export default function AccountPage() {
  return <AccountOverview />;
}
