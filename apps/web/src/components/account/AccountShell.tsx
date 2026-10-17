"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bell, ChevronRight, CreditCard, Crown, Headset, Heart, House, LogOut, MapPin, Package, Star,
  type LucideIcon,
} from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader/SiteHeader";
import { signOutUser, useSession } from "@/lib/auth";
import { useBag } from "@/lib/bag";
import { easeOutExpo } from "@/lib/motion/presets";
import styles from "./AccountShell.module.css";

const MotionLink = motion.create(Link);

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
  /** Controls shown at the right of the page heading (the orders page puts search and sort here). */
  headerActions?: ReactNode;
  children: ReactNode;
};

export function AccountShell({ active, title, subtitle, headerActions, children }: AccountShellProps) {
  const bag = useBag();
  const router = useRouter();
  const { user } = useSession();
  const reduceMotion = useReducedMotion();
  // sidebar rows slide in one after another; the same hidden state with or without reduced motion
  const row = (index: number) => ({
    initial: { opacity: 0, x: -18 },
    animate: { opacity: 1, x: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.5, ease: easeOutExpo, delay: 0.1 + index * 0.05 },
  });

  return (
    <div className={styles.page}>
      <div className={styles.announcement}>
        <p>Free Shipping on Orders Above ₹1,999 &nbsp;|&nbsp; Easy Returns &nbsp;|&nbsp; Authentic Handlooms</p>
        <p className={styles.announcementLinks}>Track Order &nbsp;|&nbsp; Help &nbsp;|&nbsp; Store Locator</p>
      </div>
      <SiteHeader bagCount={bag.count} />
      <main className={styles.main}>
        <header className={styles.headingRow}>
          <motion.div className={styles.heading} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: easeOutExpo }}>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </motion.div>
          {headerActions && (
            <motion.div className={styles.headerActions} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: easeOutExpo, delay: 0.1 }}>
              {headerActions}
            </motion.div>
          )}
        </header>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <nav aria-label="Account sections">
              {navItems.map(({ key, label, Icon, href }, index) => {
                const content = (
                  <>
                    <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                    <span>{label}</span>
                    <ChevronRight size={15} aria-hidden="true" />
                  </>
                );
                if (!href) {
                  return (
                    <motion.span key={key} className={`${styles.navItem} ${styles.navDisabled}`} aria-disabled="true" title="Not available yet" {...row(index)}>
                      {content}
                    </motion.span>
                  );
                }
                return (
                  <MotionLink key={key} href={href} className={`${styles.navItem} ${key === active ? styles.navActive : ""}`} aria-current={key === active ? "page" : undefined} {...row(index)}>
                    {content}
                  </MotionLink>
                );
              })}
            </nav>
            {user ? (
              <button type="button" className={styles.logout} onClick={async () => { await signOutUser(); router.push("/"); }}>
                <LogOut size={16} aria-hidden="true" />Logout
              </button>
            ) : (
              <Link href="/login?next=/account" className={styles.logout}>Sign in to your account</Link>
            )}
          </aside>
          <section className={styles.content}>{children}</section>
        </div>
        <p className={styles.demoNote}>Demo account data — sign-in, orders and wishlist are not connected yet.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
