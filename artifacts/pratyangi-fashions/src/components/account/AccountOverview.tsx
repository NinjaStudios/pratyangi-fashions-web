"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Crown, Heart, MapPin, Package } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard/ProductCard";
import { demoOrders, demoProfile } from "@/lib/account";
import { useBag } from "@/lib/bag";
import { homeProducts } from "@/lib/catalog";
import { AccountShell } from "./AccountShell";
import styles from "./AccountPages.module.css";

export function AccountOverview() {
  const bag = useBag();
  const recent = demoOrders.slice(0, 3);

  return (
    <AccountShell active="overview" title="My Account" subtitle="Manage your orders, addresses and more">
      <div className={styles.profile}>
        <Image className={styles.profileMark} src="/images/figma/lotus-emblem.svg" alt="" width={150} height={150} />
        <span className={styles.avatar}>
          <Image src={demoProfile.avatar} alt="" fill sizes="88px" style={{ objectFit: "cover", objectPosition: "center top" }} />
        </span>
        <div>
          <h2>Hello, {demoProfile.name}</h2>
          <p>Welcome to Pratyangi Fashions</p>
          <div className={styles.profileMeta}>
            <span className={styles.tier}>{demoProfile.tier}</span>
            <span>Since {demoProfile.memberSince}</span>
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={`${styles.stat} ${styles.statOrders}`}>
          <span className={styles.statIcon}><Package size={16} /></span>
          <span><strong>{demoProfile.totalOrders}</strong>Total orders</span>
        </div>
        <div className={`${styles.stat} ${styles.statWishlist}`}>
          <span className={styles.statIcon}><Heart size={16} /></span>
          <span><strong>{demoProfile.wishlistItems}</strong>Wishlist Items</span>
        </div>
        <div className={`${styles.stat} ${styles.statAddresses}`}>
          <span className={styles.statIcon}><MapPin size={16} /></span>
          <span><strong>{demoProfile.savedAddresses}</strong>Saved Addresses</span>
        </div>
        <div className={`${styles.stat} ${styles.statMembership}`}>
          <span className={styles.statIcon}><Crown size={16} /></span>
          <span><strong>{demoProfile.membership}</strong>Membership</span>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Recent Orders</h2>
          <Link href="/account/orders" className={styles.linkMuted}>View All Orders <ArrowRight size={14} /></Link>
        </div>
        {recent.map((order) => (
          <div className={styles.orderRow} key={order.id}>
            <span className={styles.thumb}>
              <Image src={order.items[0].image} alt="" fill sizes="56px" />
            </span>
            <div>
              <strong>{order.items[0].name}</strong>
              Order #{order.id}<br />Placed on {order.placedOn}
            </div>
            <div className={styles.status}>
              <span className={`${styles.statusLabel} ${styles[order.status]}`}>{order.status[0].toUpperCase() + order.status.slice(1)}</span>
              {order.statusNote}
            </div>
            <button type="button" className={styles.ghostButton} disabled title="Order details are not available in this demo">
              {order.status === "shipped" ? "Track Order" : "View Details"} <ChevronRight size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className={styles.sectionHead}>
        <h2>Wishlist</h2>
        <span className={styles.linkMuted} aria-disabled="true" title="Wishlist is not available yet">View Wishlist <ArrowRight size={14} /></span>
      </div>
      <div className={styles.wishlist}>
        {homeProducts.slice(0, 3).map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.name}
            imageSrc={product.image}
            priceInr={product.priceInr}
            compareAtInr={product.compareAtInr}
            onAddToCart={bag.add}
          />
        ))}
      </div>
    </AccountShell>
  );
}
