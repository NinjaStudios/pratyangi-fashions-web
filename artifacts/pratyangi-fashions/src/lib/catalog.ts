export type CatalogProduct = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  imagePosition?: string;
  priceInr: number;
  compareAtInr: number;
  tags: [string, string];
  category: string;
  fabric: string;
  color: string;
  occasion: string;
  inStock: boolean;
  addedOrder: number;
};

export const formatRs = (value: number) =>
  `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatInr = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export const discountPercent = (product: Pick<CatalogProduct, "priceInr" | "compareAtInr">) =>
  Math.round((1 - product.priceInr / product.compareAtInr) * 100);

export const bagFeatured: CatalogProduct[] = [
  {
    id: "kanchipuram-maroon",
    name: "Kanchipuram Silk Saree",
    subtitle: "Maroon with Gold Zari",
    image: "/images/figma/bag-kanchipuram.png",
    imagePosition: "center top",
    priceInr: 12499,
    compareAtInr: 15999,
    tags: ["Pure Silk", "Handwoven"],
    category: "Sarees",
    fabric: "Kanchi Pattu Saree",
    color: "#800020",
    occasion: "Wedding",
    inStock: true,
    addedOrder: 3,
  },
  {
    id: "banarasi-rose",
    name: "Banarasi Georgette Saree",
    subtitle: "Rose Pink with Silver Zari",
    image: "/images/figma/bag-banarasi.png",
    imagePosition: "center top",
    priceInr: 8999,
    compareAtInr: 11999,
    tags: ["Lightweight", "Festive Collection"],
    category: "Sarees",
    fabric: "Pure Silk Saree",
    color: "#f7549b",
    occasion: "Festive",
    inStock: true,
    addedOrder: 2,
  },
  {
    id: "soft-silk-classic",
    name: "Soft Silk Saree",
    subtitle: "Classic Handloom Weave",
    image: "/images/reference/category-soft-silk.png",
    imagePosition: "center 10%",
    priceInr: 6499,
    compareAtInr: 8499,
    tags: ["Soft Silk", "Everyday Grace"],
    category: "Sarees",
    fabric: "Bangalore Silk Saree",
    color: "#ffd15e",
    occasion: "Casual",
    inStock: true,
    addedOrder: 1,
  },
];

export const homeProducts: CatalogProduct[] = Array.from({ length: 4 }, (_, index) => ({
  id: `saree-${index + 1}`,
  name: "TRADITION MEETS ELEGANCE",
  subtitle: "Handwoven Silk Saree",
  image: `/images/reference/product-${index + 1}.jpg`,
  priceInr: 24000,
  compareAtInr: 30000,
  tags: ["Pure Silk", "Handwoven"],
  category: "Sarees",
  fabric: "Uppada Pattu Saree",
  color: "#ffd15e",
  occasion: "Festive",
  inStock: true,
  addedOrder: 10 + index,
}));

export const fabrics = [
  "Uppada Pattu Saree",
  "Pattu Saree",
  "Pure Silk Saree",
  "Kanchi Pattu Saree",
  "Bangalore Silk Saree",
  "Banarasi Saree",
  "Dharmavaram Saree",
];

export const colors = ["#800020", "#f7549b", "#ffd15e", "#38a460", "#070707", "#d7b0ef", "#00cece"];

export const occasions = ["Wedding", "Festive", "Party Wear", "Casual"];

export const shopCategories = ["Sarees", "Lehengas", "Kurtis", "Blouses"];

const categoryCycle = [...Array(43).fill("Sarees"), "Lehengas", "Lehengas", "Lehengas", "Lehengas", "Lehengas", "Kurtis", "Kurtis", "Blouses", "Blouses", "Blouses", "Blouses"];
const priceSteps = [5400, 8999, 12499, 18000, 24000, 32000, 46000, 68000, 89000, 125000];

export const newArrivals: CatalogProduct[] = Array.from({ length: 124 }, (_, index) => {
  const priceInr = priceSteps[(index * 7) % priceSteps.length];
  return {
    id: `new-arrival-${index + 1}`,
    name: "TRADITION MEETS ELEGANCE",
    subtitle: "Handwoven Silk Saree",
    image: "/images/reference/product-1.jpg",
    priceInr,
    compareAtInr: Math.round(priceInr * 1.25),
    tags: ["Pure Silk", "Handwoven"],
    category: categoryCycle[index % categoryCycle.length],
    fabric: fabrics[index % fabrics.length],
    color: colors[(index * 3) % colors.length],
    occasion: occasions[(index * 5) % occasions.length],
    inStock: index % 31 !== 30,
    addedOrder: 124 - index,
  };
});

const allProducts = [...bagFeatured, ...homeProducts, ...newArrivals];

export const findProduct = (id: string) => allProducts.find((product) => product.id === id);
