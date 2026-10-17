/** Demo account data. No sign-in or order service exists yet; replace with real data when one does. */
export type OrderStatus = "delivered" | "shipped" | "cancelled";

export type DemoOrder = {
  id: string;
  placedOn: string;
  total: number;
  status: OrderStatus;
  statusNote: string;
  items: { productId: string; name: string; subtitle: string; image: string; quantity: number }[];
};

const kanchipuram = { productId: "kanchipuram-maroon", name: "Kanchipuram Silk Saree", subtitle: "Maroon with Gold Zari", image: "/images/figma/bag-kanchipuram.webp", quantity: 1 };
const banarasi = { productId: "banarasi-rose", name: "Banarasi Georgette Saree", subtitle: "Rose Pink with Silver Zari", image: "/images/figma/bag-banarasi.webp", quantity: 1 };
const chanderi = { productId: "soft-silk-classic", name: "Chanderi Cotton Silk Saree", subtitle: "Emerald Green with Gold Border", image: "/images/reference/category-dharmavaram.webp", quantity: 1 };

export const demoOrders: DemoOrder[] = [
  { id: "PF123456", placedOn: "2 Oct 2026", total: 22798, status: "delivered", statusNote: "on 5 Oct 2026", items: [kanchipuram, chanderi, banarasi, kanchipuram] },
  { id: "PF123455", placedOn: "22 Sep 2026", total: 2798, status: "shipped", statusNote: "Expected by 18 Oct 2026", items: [banarasi] },
  { id: "PF123454", placedOn: "22 Sep 2026", total: 7448, status: "cancelled", statusNote: "Cancelled on 15 Oct 2026", items: [banarasi] },
  { id: "PF123453", placedOn: "2 Sep 2026", total: 4798, status: "delivered", statusNote: "on 5 Sep 2026", items: [kanchipuram, banarasi, chanderi] },
];

export const demoProfile = {
  name: "Sree",
  memberSince: "Oct 2026",
  tier: "Silver Member",
  totalOrders: 12,
  wishlistItems: 2,
  savedAddresses: 9,
  membership: "Silver",
  avatar: "/images/reference/hero-model-right1.webp",
};

export const formatOrderTotal = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/** 52 demo orders (13 pages of 4, as in the design): the four samples above repeated with new numbers and dates. */
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
export const allDemoOrders: DemoOrder[] = Array.from({ length: 52 }, (_, index) => {
  const base = demoOrders[index % demoOrders.length];
  if (index < demoOrders.length) return base;
  const month = monthNames[9 - Math.floor(index / 6) % 10];
  const day = 1 + ((index * 7) % 27);
  return {
    ...base,
    id: `PF${123456 - index}`,
    placedOn: `${day} ${month} 2026`,
    statusNote: base.status === "shipped" ? "Expected by 18 Oct 2026" : base.status === "cancelled" ? `Cancelled on ${day + 1} ${month} 2026` : `on ${day + 3} ${month} 2026`,
  };
});
