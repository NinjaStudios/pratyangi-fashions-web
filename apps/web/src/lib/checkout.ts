/** Prices and demo data shared by the bag and checkout pages. Everything here is local demo data (no backend yet). */

export const freeShippingThreshold = 1999;
export const expressDeliveryFee = 99;

/** Coupon code -> share of the subtotal taken off. */
export const coupons: Record<string, number> = { FIRST20: 0.2, WELCOME10: 0.1 };

export type DeliveryOption = { id: "standard" | "express"; name: string; fee: number; window: string; note: string };

export const deliveryOptions: DeliveryOption[] = [
  { id: "standard", name: "Standard Delivery", fee: 0, window: "4 - 6 business days", note: "Reliable and safe delivery" },
  { id: "express", name: "Express Delivery", fee: expressDeliveryFee, window: "2 - 3 business days", note: "Faster delivery" },
];

export type AddressType = "Home" | "Office" | "Other";

export type SavedAddress = {
  id: string;
  label: AddressType;
  isDefault?: boolean;
  name: string;
  phone: string;
  house: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
};

/** The address as one readable block of text, e.g. for the checkout list. */
export const addressLines = (address: SavedAddress) =>
  [address.house, address.area, address.landmark, address.city, address.state].filter(Boolean).join(", ") + " - " + address.pincode;

/** Sample addresses from the Figma design, so the page can be reviewed before accounts exist. */
export const demoAddresses: SavedAddress[] = [
  { id: "home", label: "Home", isDefault: true, name: "Gaurav Kumar", phone: "+91 9876543210", house: "50-1-16", area: "Seethammadara Eenadu Main Road", landmark: "near Sivalayam", city: "Visakhapatnam", state: "Andhra Pradesh", pincode: "530013" },
  { id: "other", label: "Other", name: "Gaurav Kumar", phone: "+91 98765 43210", house: "12-4-8", area: "MG Road", city: "Vijayawada", state: "Andhra Pradesh", pincode: "520010" },
  { id: "office", label: "Office", name: "Surya", phone: "+91 98765 00000", house: "Level 1, Unit 2, Salarpuria Sattva Knowledge City", area: "Sy. No. 83/1, Plot No. 2, Inorbit Mall Road, Raidurg Village, HITEC City", city: "Hyderabad", state: "Telangana", pincode: "500081" },
];
