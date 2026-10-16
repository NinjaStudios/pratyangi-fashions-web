"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell, ChevronRight, CreditCard, Crown, Headset, Heart, House, LogOut, MapPin, Package, Star,
  type LucideIcon,
} from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader/SiteHeader";
import { useBag } from "@/lib/bag";
import styles from "./AccountShell.module.css";

type NavItem = { key: string; label: string; Icon: LucideIcon; href?: string };

const navItems: NavItem[] = [
  { key: "overview", label: "Overview", Icon: House, href: "/account" },
  { key: "orders", label: "My Orders", Icon: Package, href: "/account/orders" },
  { key: "wishlist", label: "Wishlist", Icon: Heart },
  { key: "addresses", label: "Addresses", Icon: MapPin },
  { key: "payments", label: "Payment Methods", Icon: CreditCard },
  { key: "membership", label: "Membership", Icon: Crown },
  { key: "reviews", label: "My Reviews", Icon: Star },
  { key: "notifications", label: "Notifications", Icon: Bell },
  { key: "support", label: "Help & Support", Icon: Headset },
];

type AccountShellProps = {
  active: "overview" | "orders";
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AccountShell({ active, title, subtitle, children }: AccountShellProps) {
  const bag = useBag();

  return (
    <div className={styles.page}>
      <div className={styles.announcement}>
        <p>Free Shipping on Orders Above ₹1,999 &nbsp;|&nbsp; Easy Returns &nbsp;|&nbsp; Authentic Handlooms</p>
        <p className={styles.announcementLinks}>Track Order &nbsp;|&nbsp; Help &nbsp;|&nbsp; Store Locator</p>
      </div>
      <SiteHeader bagCount={bag.count} />
      <main className={styles.main}>
        <header className={styles.heading}>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <nav aria-label="Account sections">
              {navItems.map(({ key, label, Icon, href }) => {
                const content = (
                  <>
                    <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                    <span>{label}</span>
                    <ChevronRight size={14} aria-hidden="true" />
                  </>
                );
                if (!href) {
                  return (
                    <span key={key} className={`${styles.navItem} ${styles.navDisabled}`} aria-disabled="true" title="Not available yet">
                      {content}
                    </span>
                  );
                }
                return (
                  <Link key={key} href={href} className={`${styles.navItem} ${key === active ? styles.navActive : ""}`} aria-current={key === active ? "page" : undefined}>
                    {content}
                  </Link>
                );
              })}
            </nav>
            <button type="button" className={styles.logout} disabled title="Sign-in is not connected in this demo">
              <LogOut size={16} aria-hidden="true" />Logout
            </button>
          </aside>
          <section className={styles.content}>{children}</section>
        </div>
        <p className={styles.demoNote}>Demo account data — sign-in, orders and wishlist are not connected yet.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
