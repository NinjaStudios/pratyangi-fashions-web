"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader/SiteHeader";
import { ProductCard } from "@/components/ui/ProductCard/ProductCard";
import { useBag } from "@/lib/bag";
import { colors, fabrics, newArrivals, occasions, shopCategories } from "@/lib/catalog";
import styles from "./new-arrivals.module.css";

const pageSize = 9;
const priceStops = [5000, 15000, 40000, 70000, 100000, 1000000];
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;
type SortValue = (typeof sortOptions)[number]["value"];

const colorNames: Record<string, string> = {
  "#800020": "Burgundy", "#f7549b": "Pink", "#ffd15e": "Gold", "#38a460": "Green",
  "#070707": "Black", "#d7b0ef": "Lavender", "#00cece": "Teal",
};

const countBy = (key: "category" | "fabric" | "occasion", value: string) =>
  newArrivals.filter((product) => product[key] === value).length;
const inStockCount = newArrivals.filter((product) => product.inStock).length;
const priceLabel = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const toggle = (list: string[], value: string) => list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

function pageList(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "gap", total];
  if (current >= total - 3) return [1, "gap", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "gap", current - 1, current, current + 1, "gap", total];
}

export function NewArrivalsView() {
  const bag = useBag();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [priceIndex, setPriceIndex] = useState(priceStops.length - 1);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [showAllFabrics, setShowAllFabrics] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortValue>("newest");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const maxPrice = priceStops[priceIndex];
  const filtered = newArrivals
    .filter((product) => (
      (!category || product.category === category)
      && product.priceInr <= maxPrice
      && (!selectedFabrics.length || selectedFabrics.includes(product.fabric))
      && (!selectedColors.length || selectedColors.includes(product.color))
      && (!selectedOccasions.length || selectedOccasions.includes(product.occasion))
      && (!inStockOnly || product.inStock)
    ))
    .sort((a, b) => sort === "price-asc" ? a.priceInr - b.priceInr : sort === "price-desc" ? b.priceInr - a.priceInr : b.addedOrder - a.addedOrder);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = category || priceIndex !== priceStops.length - 1 || selectedFabrics.length || selectedColors.length || selectedOccasions.length || inStockOnly;

  const update = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setPage(1); };

  const clearFilters = () => {
    setCategory(null);
    setPriceIndex(priceStops.length - 1);
    setSelectedFabrics([]);
    setSelectedColors([]);
    setSelectedOccasions([]);
    setInStockOnly(false);
    setPage(1);
  };

  const goToPage = (next: number) => {
    setPage(next);
    document.getElementById("catalog-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addToBag = (id: string) => {
    bag.add(id);
    setStatus("Added to your bag.");
  };

  return (
    <main className={styles.page}>
      <SiteHeader bagCount={bag.count} />

      <div className={styles.catalog}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <Image src="/images/figma/chevron-right.svg" alt="" width={12} height={12} />
          <span aria-current="page">New Arrivals</span>
        </nav>

        <div className={styles.content}>
          <aside className={styles.sidebar} aria-label="Catalog filters">
            <button type="button" className={styles.sidebarToggle} aria-expanded={categoriesOpen} onClick={() => setCategoriesOpen(!categoriesOpen)}>
              Categories
              <Image className={styles.toggleArrow} src="/images/figma/filter-arrow.svg" alt="" width={20} height={20} />
            </button>
            {categoriesOpen && (
              <ul className={styles.categoryList}>
                <li>
                  <button type="button" aria-pressed={!category} onClick={() => update(setCategory)(null)}>All New Arrivals ({newArrivals.length})</button>
                </li>
                {shopCategories.map((name) => (
                  <li key={name}>
                    <button type="button" aria-pressed={category === name} onClick={() => update(setCategory)(name)}>{name} ({countBy("category", name)})</button>
                  </li>
                ))}
              </ul>
            )}

            <button type="button" className={styles.sidebarToggle} aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>
              Filters
              <Image className={styles.toggleArrow} src="/images/figma/filter-arrow.svg" alt="" width={20} height={20} />
            </button>
            {filtersOpen && (
              <div className={styles.filters}>
                <div className={`${styles.filterGroup} ${styles.priceGroup}`}>
                  <label className={styles.priceTitle} htmlFor="price-range">Price Range</label>
                  <input
                    id="price-range"
                    className={styles.slider}
                    type="range"
                    min={0}
                    max={priceStops.length - 1}
                    step={1}
                    value={priceIndex}
                    aria-valuetext={`Up to ${priceLabel(maxPrice)}`}
                    style={{ "--fill": `${(priceIndex / (priceStops.length - 1)) * 100}%` } as CSSProperties}
                    onChange={(event) => update(setPriceIndex)(Number(event.target.value))}
                  />
                  <div className={styles.priceLabels}><span>{priceLabel(priceStops[0])}</span><span>{priceLabel(maxPrice)}</span></div>
                </div>

                <div className={styles.filterGroup} role="group" aria-label="Fabric">
                  <h3>Fabric</h3>
                  {(showAllFabrics ? fabrics : fabrics.slice(0, 5)).map((fabric) => (
                    <label className={styles.choice} key={fabric}>
                      <input type="checkbox" checked={selectedFabrics.includes(fabric)} onChange={() => update(setSelectedFabrics)(toggle(selectedFabrics, fabric))} />
                      {fabric} ({countBy("fabric", fabric)})
                    </label>
                  ))}
                  <button type="button" className={styles.showMore} onClick={() => setShowAllFabrics(!showAllFabrics)}>
                    {showAllFabrics ? "− Show Less" : "+ Show More"}
                  </button>
                </div>

                <div className={styles.filterGroup} role="group" aria-label="Color">
                  <h3>Color</h3>
                  <div className={styles.colors}>
                    {colors.map((color) => (
                      <button
                        type="button"
                        key={color}
                        className={styles.swatch}
                        style={{ background: color }}
                        aria-label={colorNames[color]}
                        aria-pressed={selectedColors.includes(color)}
                        onClick={() => update(setSelectedColors)(toggle(selectedColors, color))}
                      />
                    ))}
                  </div>
                </div>

                <div className={styles.filterGroup} role="group" aria-label="Occasion">
                  <h3>Occasion</h3>
                  {occasions.map((occasion) => (
                    <label className={styles.choice} key={occasion}>
                      <input type="checkbox" checked={selectedOccasions.includes(occasion)} onChange={() => update(setSelectedOccasions)(toggle(selectedOccasions, occasion))} />
                      {occasion} ({countBy("occasion", occasion)})
                    </label>
                  ))}
                </div>

                <div className={styles.filterGroup} role="group" aria-label="Availability">
                  <h3>Availability</h3>
                  <label className={styles.choice}>
                    <input type="checkbox" checked={inStockOnly} onChange={() => update(setInStockOnly)(!inStockOnly)} />
                    In Stock ({inStockCount})
                  </label>
                </div>

                {hasFilters ? <button type="button" className={styles.showMore} onClick={clearFilters}>Clear all filters</button> : null}
              </div>
            )}
          </aside>

          <section className={styles.listing} id="catalog-top" aria-label="New arrivals">
            <div className={styles.intro}>
              <div className={styles.introTitle}>
                <h1>New Arrivals</h1>
                <p>Discover the latest additions to our exclusive collection</p>
              </div>
              <div className={styles.promise}>
                <Image src="/images/figma/lotus-emblem.svg" alt="" width={53} height={47} />
                <div>
                  <p className={styles.promiseTagline}>Fresh Styles. Timeless Grace.</p>
                  <p className={styles.promiseCopy}>Handpicked designs for the modern you.</p>
                </div>
              </div>
            </div>

            <div className={styles.toolbar}>
              <p>{filtered.length} {filtered.length === 1 ? "Product" : "Products"}</p>
              <label className={styles.sort}>
                <span>Sort by:</span>
                <span className={styles.sortField}>
                  <select value={sort} onChange={(event) => update(setSort)(event.target.value as SortValue)}>
                    {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <Image className={styles.sortArrow} src="/images/figma/sort-arrow.svg" alt="" width={27} height={27} />
                </span>
              </label>
            </div>

            {status && <p className={styles.status} role="status">{status}</p>}

            {visible.length ? (
              <div className={styles.grid}>
                {visible.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.name}
                    imageSrc={product.image}
                    priceInr={product.priceInr}
                    compareAtInr={product.compareAtInr}
                    onAddToCart={addToBag}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <p>No products match these filters.</p>
                <button type="button" onClick={clearFilters}>Clear all filters</button>
              </div>
            )}

            {totalPages > 1 && (
              <nav className={styles.pagination} aria-label="Pagination">
                <button type="button" className={styles.pageArrow} disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} aria-label="Previous page">‹</button>
                {pageList(currentPage, totalPages).map((entry, index) => entry === "gap"
                  ? <span key={`gap-${index}`} className={styles.pageGap}>…</span>
                  : <button type="button" key={entry} aria-current={entry === currentPage ? "page" : undefined} onClick={() => goToPage(entry)}>{entry}</button>)}
                <button type="button" className={styles.pageArrow} disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)} aria-label="Next page">›</button>
              </nav>
            )}
          </section>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
