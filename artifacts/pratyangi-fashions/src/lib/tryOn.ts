export type TryOnTierId = "silver" | "platinum" | "gold";

export type TryOnTier = {
  id: TryOnTierId;
  name: string;
  /** Catalog product added to the bag from this tier. */
  productId: string;
  /** Saree photo sent to the AI as the garment reference. */
  image: string;
  /** Figma card background. */
  cardImage: string;
  icon: string;
  detail: string;
  status: string;
};

const asset = (name: string) => `/images/figma/try-on/${name}`;

export const tryOnTiers: TryOnTier[] = [
  { id: "silver", name: "Silver", productId: "saree-1", image: "/images/reference/product-1.jpg", cardImage: asset("card-silver.png"), icon: asset("icon-tick.svg"), detail: "Try all our beautiful silver sarees today.", status: "Available to all" },
  { id: "platinum", name: "Platinum", productId: "saree-2", image: "/images/reference/product-2.jpg", cardImage: asset("card-platinum.png"), icon: asset("icon-lock.svg"), detail: "Purchase a Silver saree to unlock Platinum Try-On.", status: "Unlocked after a Silver purchase" },
  { id: "gold", name: "Gold", productId: "saree-3", image: "/images/reference/product-3.jpg", cardImage: asset("card-gold.png"), icon: asset("icon-block.svg"), detail: "Available for direct purchase only.", status: "AI Try-On unavailable" },
];

export const silverProductIds = tryOnTiers.filter((tier) => tier.id === "silver").map((tier) => tier.productId);

/** Platinum unlocks once a Silver saree is in the bag (stand-in for a real purchase until checkout exists). */
export const isTierAvailable = (tier: TryOnTierId, bagProductIds: string[]) =>
  tier === "silver" || (tier === "platinum" && bagProductIds.some((id) => silverProductIds.includes(id)));

const tryOnEndpoint = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/try-on`;
const maxSide = 1024;

type InlineImage = { mimeType: string; data: string };

/** Decodes an image (file or same-origin URL), downsizes it, and re-encodes it as JPEG base64. */
export async function toInlineImage(source: Blob | string): Promise<InlineImage> {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable in this browser.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { mimeType: "image/jpeg", data: canvas.toDataURL("image/jpeg", 0.9).split(",")[1] };
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(url);
  }
}

export async function requestTryOn(tier: TryOnTierId, photo: Blob, garmentSrc: string): Promise<string> {
  let personImage: InlineImage;
  try {
    personImage = await toInlineImage(photo);
  } catch {
    throw new Error("We couldn't read that photo. Please upload a JPEG or PNG image.");
  }
  const garmentImage = await toInlineImage(garmentSrc);

  let response: Response;
  try {
    response = await fetch(tryOnEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, personImage, garmentImage }),
    });
  } catch {
    throw new Error("Couldn't reach the try-on service. Check your connection and try again.");
  }

  const result = (await response.json().catch(() => ({}))) as { image?: string; error?: string };
  if (!response.ok || !result.image) throw new Error(result.error ?? "Something went wrong creating your look.");
  return result.image;
}
