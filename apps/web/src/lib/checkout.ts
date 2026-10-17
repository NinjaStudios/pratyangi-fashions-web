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
  /** Home, Office or Other. */
  type: AddressType;
  /** What the address is called in lists: the optional custom label (for example "PG"), else the type. */
  label: string;
  isDefault?: boolean;
  name: string;
  /** Always stored as "+91 " followed by the ten digits. */
  phone: string;
  house: string;
  /** Street, area and landmark in one line. */
  street: string;
  city: string;
  state: string;
  pincode: string;
};

/** The address as one readable block of text, e.g. for the checkout list. */
export const addressLines = (address: SavedAddress) => [address.house, address.street, address.city, address.state].filter(Boolean).join(", ") + " - " + address.pincode;

/** Sample addresses from the Figma design, so the page can be reviewed before accounts exist. */
export const demoAddresses: SavedAddress[] = [
  { id: "home", type: "Home", label: "Home", isDefault: true, name: "Gaurav Kumar", phone: "+91 9876543210", house: "50-1-16", street: "Seethammadara, Eenadu Main Road, near Sivalayam", city: "Visakhapatnam", state: "Andhra Pradesh", pincode: "530013" },
  { id: "office", type: "Office", label: "Office", name: "Gaurav Kumar", phone: "+91 9876543210", house: "Level 1, Unit 2, Knowledge City", street: "HITC City", city: "Hyderabad", state: "Telangana", pincode: "500081" },
  { id: "pg", type: "Other", label: "PG", name: "Gaurav Kumar", phone: "+91 9876543210", house: "Room 12, Sunrise PG", street: "HITC City", city: "Hyderabad", state: "Telangana", pincode: "500081" },
];

/** Indian mobile numbers: ten digits starting 6-9. A leading +91, 91 or 0 and any spaces or dashes are ignored. */
export const normalisePhone = (value: string) => value.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
export const validatePhone = (value: string) => {
  const digits = normalisePhone(value);
  if (!digits) return "Enter the delivery mobile number.";
  if (!/^[6-9]\d{9}$/.test(digits)) return "Enter a valid 10-digit mobile number that starts with 6, 7, 8 or 9.";
  return "";
};

export const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

/** Demo pincode check (no postal service is connected yet): a few well-known pincodes fill in the city and state. */
export const demoPincodes: Record<string, { city: string; state: string }> = {
  "530013": { city: "Visakhapatnam", state: "Andhra Pradesh" },
  "520010": { city: "Vijayawada", state: "Andhra Pradesh" },
  "500081": { city: "Hyderabad", state: "Telangana" },
  "500001": { city: "Hyderabad", state: "Telangana" },
  "560001": { city: "Bengaluru", state: "Karnataka" },
  "600001": { city: "Chennai", state: "Tamil Nadu" },
  "400001": { city: "Mumbai", state: "Maharashtra" },
  "110001": { city: "New Delhi", state: "Delhi" },
  "700001": { city: "Kolkata", state: "West Bengal" },
};
