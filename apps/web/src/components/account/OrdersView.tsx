"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight, Search } from "lucide-react";
import { demoOrders, formatOrderTotal } from "@/lib/account";
import { useBag } from "@/lib/bag";
import { AccountShell } from "./AccountShell";
import styles from "./AccountPages.module.css";

export function OrdersView() {
  const bag = useBag();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const [notice, setNotice] = useState("");

  const term = query.trim().toLowerCase();
  const matching = demoOrders.filter((order) => !term || order.id.toLowerCase().includes(term) || order.items.some((item) => item.name.toLowerCase().includes(term)));
  // demoOrders is already newest-first.
  const visible = sort === "recent" ? matching : [...matching].reverse();

  return (
    <AccountShell active="orders" title="My Orders" subtitle="Track, return or buy again from your past orders.">
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={14} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your orders (e.g. saree, order ID...)" aria-label="Search your orders" />
        </label>
        <label className={styles.sort}>
          Sort by:
          <select value={sort} onChange={(event) => setSort(event.target.value as "recent" | "oldest")}>
            <option value="recent">Recent First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </label>
      </div>

      {notice && <p className={styles.notice} role="status">{notice}</p>}

      {visible.length === 0 && <p className={styles.emptyState}>No orders match your search.</p>}

      {visible.map((order) => {
        const [first, ...rest] = order.items;
        const count = order.items.length;
        return (
          <article className={styles.orderCard} key={order.id}>
            <div>
              <div className={styles.orderId}>Order ID #{order.id}</div>
              <div className={styles.orderMeta}>
                <span>Placed on {order.placedOn}</span>
                <span>{count} {count === 1 ? "item" : "items"}</span>
                <span><b>{formatOrderTotal(order.total)}</b></span>
              </div>
              {count === 1 ? (
                <div className={styles.single}>
                  <span className={styles.thumb}><Image src={first.image} alt="" fill sizes="48px" /></span>
                  <span>
                    <strong>{first.name}</strong>
                    <small>{first.subtitle}<br />Qty: {first.quantity} &nbsp;|&nbsp; Size: Free Size</small>
                  </span>
                </div>
              ) : (
                <div className={styles.thumbs}>
                  {[first, ...rest.slice(0, 2)].map((item, index) => (
                    <span className={styles.thumb} key={`${item.productId}-${index}`}><Image src={item.image} alt="" fill sizes="48px" /></span>
                  ))}
                  {count > 3 && <span className={styles.more}><b>+{count - 3}</b>More Items</span>}
                </div>
              )}
            </div>
            <div className={styles.status}>
              <span className={`${styles.statusLabel} ${styles[order.status]}`}>{order.status[0].toUpperCase() + order.status.slice(1)}</span>
              {order.statusNote}
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.ghostButton} disabled title="Order details are not available in this demo">View Details <ChevronRight size={13} /></button>
              {order.status === "shipped" ? (
                <button type="button" className={styles.solidButton} disabled title="Tracking is not available in this demo">Track Order</button>
              ) : (
                <button
                  type="button"
                  className={styles.solidButton}
                  onClick={() => {
                    bag.add(first.productId);
                    setNotice(`${first.name} added to your bag.`);
                  }}
                >
                  Buy Again
                </button>
              )}
            </div>
          </article>
        );
      })}
    </AccountShell>
  );
}
