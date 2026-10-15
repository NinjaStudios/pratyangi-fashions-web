"use client";

import { useCallback, useEffect, useState } from "react";
import { bagFeatured, findProduct } from "@/lib/catalog";

export type BagLine = { id: string; quantity: number };

const bagStorageKey = "pratyangi-demo-bag";
const bagEvent = "pratyangi-bag-change";
const maxQuantity = 10;

const seedBag: BagLine[] = bagFeatured.map((product) => ({ id: product.id, quantity: 1 }));

function parseBag(raw: string | null): BagLine[] | null {
  if (raw === null) return seedBag;
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return null;
  const lines: BagLine[] = [];
  for (const entry of parsed) {
    const line = typeof entry === "string" ? { id: entry, quantity: 1 } : entry;
    if (!line || typeof line.id !== "string" || typeof line.quantity !== "number") return null;
    if (findProduct(line.id)) lines.push({ id: line.id, quantity: Math.min(Math.max(1, Math.round(line.quantity)), maxQuantity) });
  }
  return lines;
}

export function useBag() {
  const [lines, setLines] = useState<BagLine[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    try {
      const parsed = parseBag(window.localStorage.getItem(bagStorageKey));
      if (parsed) setLines(parsed);
      else setMessage("The saved demo bag could not be read, so it started empty.");
    } catch {
      setMessage("Browser storage is unavailable; bag changes will not persist.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
    const sync = (event: Event) => {
      if (event instanceof StorageEvent && event.key !== bagStorageKey) return;
      load();
    };
    window.addEventListener("storage", sync);
    window.addEventListener(bagEvent, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(bagEvent, sync);
    };
  }, [load]);

  const commit = useCallback((update: (current: BagLine[]) => BagLine[]) => {
    setLines((current) => {
      const next = update(current);
      try {
        window.localStorage.setItem(bagStorageKey, JSON.stringify(next));
        queueMicrotask(() => window.dispatchEvent(new Event(bagEvent)));
      } catch {
        setMessage("Browser storage is unavailable; bag changes will not persist.");
      }
      return next;
    });
  }, []);

  const add = useCallback((id: string) => commit((current) => (
    current.some((line) => line.id === id)
      ? current.map((line) => line.id === id ? { ...line, quantity: Math.min(line.quantity + 1, maxQuantity) } : line)
      : [...current, { id, quantity: 1 }]
  )), [commit]);

  const remove = useCallback((id: string) => commit((current) => current.filter((line) => line.id !== id)), [commit]);

  const setQuantity = useCallback((id: string, quantity: number) => commit((current) => (
    current.map((line) => line.id === id ? { ...line, quantity: Math.min(Math.max(1, quantity), maxQuantity) } : line)
  )), [commit]);

  const count = lines.reduce((total, line) => total + line.quantity, 0);

  return { lines, ready, message, count, add, remove, setQuantity, maxQuantity };
}
