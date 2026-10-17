"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronRight, Search, UserRound, X } from "lucide-react";
import { useSession } from "@/lib/auth";
import { catalogLink, fabricAliases, fabrics } from "@/lib/catalog";
import { easeOutExpo } from "@/lib/motion/presets";
import styles from "./SiteHeader.module.css";

// Solid shopping bag with its handle, matching the original design (the icon library's filled bag loses the handle).
function BagIcon() {
  return (
    <svg width="24" height="28" viewBox="0 0 24 28" aria-hidden="true" focusable="false">
      <rect x="0" y="8" width="24" height="20" rx="2.5" fill="currentColor" />
      <path d="M6.6 11V7.2a5.4 5.4 0 0 1 10.8 0V11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

// The Shop mega menu (from the Figma nav bar). Every link goes to the catalogue until category pages exist.
const menuGroups = [
  {
    title: "WOMEN",
    links: [
      { label: "Half Sarees", href: catalogLink({}) },
      { label: "Uppada", href: catalogLink({ fabric: "Uppada Pattu Saree" }) },
      { label: "Banarasi", href: catalogLink({ fabric: "Banarasi Saree" }) },
      { label: "Kanchipuram Patti", href: catalogLink({ fabric: "Kanchi Pattu Saree" }) },
      { label: "Dharmavaram", href: catalogLink({ fabric: "Dharmavaram Saree" }) },
      { label: "Soft Silk", href: catalogLink({ fabric: "Bangalore Silk Saree" }) },
      { label: "Bridal Sarees", href: catalogLink({ occasion: "Wedding" }) },
      { label: "Gadwal", href: catalogLink({}) },
    ],
  },
  { title: "MEN", links: [{ label: "Men’s Ethnic Wear", href: catalogLink({}) }] },
  { title: "JEWELLERY", links: [{ label: "Jewellery", href: catalogLink({}) }, { label: "Accessories", href: catalogLink({}) }] },
];

// Hamburger that turns into a cross: the outer bars rotate into an X and the middle bar fades out.
function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={styles.menuIcon} data-open={open} aria-hidden="true">
      <span /><span /><span />
    </span>
  );
}

type SearchEntry = { label: string; href: string; keywords?: string[] };

// Picking a fabric opens New Arrivals with that fabric ticked in the filters and only those sarees listed.
const defaultSearchEntries: SearchEntry[] = [
  { label: "New Arrivals", href: catalogLink({}) },
  ...fabrics.map((fabric) => ({ label: fabric, href: catalogLink({ fabric }), keywords: fabricAliases[fabric] })),
  { label: "Bridal Sarees", href: catalogLink({ occasion: "Wedding" }), keywords: ["bridal", "wedding"] },
  { label: "Wedding Collection", href: catalogLink({ occasion: "Wedding" }) },
  { label: "Festive Collections", href: catalogLink({ occasion: "Festive" }), keywords: ["festival"] },
  { label: "Best Sellers", href: "/#arrivals" },
];

type SiteHeaderProps = {
  bagCount: number;
};

export function SiteHeader({ bagCount }: SiteHeaderProps) {
  const reduceMotion = useReducedMotion();
  const { user } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<"search" | null>(null);
  const [query, setQuery] = useState("");

  const term = query.trim().toLowerCase();
  const results = term ? defaultSearchEntries.filter((entry) => [entry.label, ...(entry.keywords ?? [])].some((text) => text.toLowerCase().includes(term))) : defaultSearchEntries;
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closePanel = () => {
    setPanel(null);
    searchButtonRef.current?.focus();
  };

  // Keyboard access: Esc closes the search dialog or Shop menu, and Tab stays inside the open dialog.
  useEffect(() => {
    if (!panel && !menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (panel) {
          setPanel(null);
          searchButtonRef.current?.focus();
        } else {
          setMenuOpen(false);
        }
        return;
      }
      if (event.key !== "Tab" || !panel || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panel, menuOpen]);

  return (
    <>
      <motion.header
        className={styles.header}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: easeOutExpo }}
      >
        <div className={styles.headerInner}>
          <button className={styles.shopToggle} type="button" aria-label="Shop menu" aria-expanded={menuOpen} aria-controls="shop-menu" onClick={() => setMenuOpen(!menuOpen)}>
            <MenuIcon open={menuOpen} />
            <span>Shop</span><ChevronDown className={styles.shopChevron} size={13} />
          </button>
          <Link className={styles.brand} href="/" aria-label="Pratyangi Fashions home">
            <span className={styles.brandLogo}>
              <Image src="/images/reference/brand-emblem.webp" alt="" width={58} height={58} priority />
            </span>
            <span className={styles.brandText}>
              <span className={styles.brandName}>PRATYANGI FASHIONS</span>
              <span className={styles.brandTagline}>TRADITION MEETS ELEGANCE</span>
            </span>
          </Link>
          <div className={styles.headerActions}>
            <button ref={searchButtonRef} className={styles.searchButton} type="button" aria-label="Search catalog" onClick={() => { setPanel("search"); setMenuOpen(false); }}>
              <span>Search</span><Search size={17} />
            </button>
            <Link className={styles.iconButton} href="/bag" aria-label={`Open your bag, ${bagCount} items`}>
              <BagIcon /><span className={styles.count}>{bagCount}</span>
            </Link>
            <Link className={styles.iconButton} href={user ? "/account" : "/login"} aria-label={user ? "My account" : "Sign in"}>
              <UserRound size={22} fill="currentColor" />
            </Link>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className={styles.menuBackdrop} onMouseDown={() => setMenuOpen(false)} aria-hidden="true" />
              <motion.nav
                id="shop-menu"
                className={styles.menuPanel}
                aria-label="Shop sections"
                initial={reduceMotion ? false : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
                exit={reduceMotion ? undefined : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.42, ease: easeOutExpo }}
              >
                {menuGroups.map((group, groupIndex) => (
                  <motion.div
                    className={styles.menuGroup}
                    key={group.title}
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: easeOutExpo, delay: 0.12 + groupIndex * 0.07 }}
                  >
                    <h2>{group.title}</h2>
                    <ul>
                      {group.links.map((link) => (
                        <li key={link.label}><Link href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link></li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </motion.nav>
            </>
          )}
        </AnimatePresence>
      </motion.header>

      <AnimatePresence>
        {panel && (
          <motion.div
            className={styles.scrim}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onMouseDown={(event) => { if (event.target === event.currentTarget) closePanel(); }}
          >
            <motion.section
              ref={dialogRef}
              className={styles.dialog}
              role="dialog"
              aria-modal="true"
              aria-label="Search catalog"
              initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.24, ease: easeOutExpo }}
            >
              <button type="button" className={styles.closeButton} onClick={closePanel} aria-label="Close panel"><X size={20} /></button>
              <>
                <h2>Search</h2>
                <label className={styles.srOnly} htmlFor="catalog-search">Search the catalog</label>
                <div className={styles.searchField}><Search size={18} /><input id="catalog-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the catalog" /></div>
                <div className={styles.searchResults}>
                  {results.length ? results.map((entry) => (
                    <Link href={entry.href} key={entry.label} onClick={closePanel}>{entry.label}<ChevronRight size={15} /></Link>
                  )) : <p>No matching items in this catalog preview.</p>}
                </div>
              </>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
