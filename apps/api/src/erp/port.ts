/**
 * The ONE place the store API will talk to the ERP. Nothing else in apps/api may know how the ERP stores or serves anything.
 *
 * STATUS: contract only. No adapter is connected, and no route uses this yet. Everything marked "needs ERP change" below is NOT
 * available in the ERP today (verified by reading its source, see docs/ERP_INTEGRATION.md); the interface says what the
 * storefront needs, so the ERP side can be built or confirmed against it. Do not add an implementation until the ERP team has
 * agreed the endpoints and the source-of-truth rules in that document.
 *
 * Money is whole paise (integers) at this boundary; the ERP stores DECIMAL rupees, so the adapter converts in one place.
 */

/** A sellable item as the website needs it. The ERP owns every field; the website never edits any of them. */
export type ErpProduct = {
  /** The ERP's SKU: the stable key the ERP's own order API accepts. */
  sku: string;
  name: string;
  categoryName: string | null;
  /** The ERP has no variant table: size and colour are columns on the product row, so each SKU is one sellable variant. */
  color: string | null;
  size: string | null;
  fabric: string | null;
  /** MRP, and the price the website sells at. Which ERP price column that is (retail_price or offer_price) is still a business decision. */
  mrpPaise: number;
  sellingPricePaise: number;
  /** Path or URL of the product image as the ERP stores it. */
  imagePath: string | null;
  active: boolean;
};

/** Pieces that can be promised to a website customer right now: on-hand minus reserved, at locations the ERP enables for online orders. */
export type ErpAvailability = { sku: string; availablePieces: number };

/** What the ERP accepts today (POST /api/order_create.php). Only these fields exist; the ERP stores the amount it is given and does not check it. */
export type ErpOrderRequest = {
  /** Our order number; also sent as external_order_id so a retry returns the same order instead of making a second one. */
  orderNo: string;
  customerName: string;
  /** The delivery contact, not the login. */
  customerMobile: string;
  /** One text block: the ERP has a single shipping_address column. */
  shippingAddress: string;
  items: { sku: string; quantity: number }[];
  /** Computed by the store API from ERP prices, never taken from the browser. */
  orderAmountPaise: number;
  paymentStatus: "PAID" | "COD" | "PENDING";
};

export type ErpOrderCreated = { erpOrderId: number; erpOrderNo: string; status: "ALLOCATED"; duplicate: boolean };

export type ErpOrderStatus = { erpOrderNo: string; status: string; courier: string | null; awb: string | null; dispatchedAt: string | null };

export type ErpPort = {
  /** Needs ERP change: the ERP has no public catalogue endpoint (product_lookup.php needs a staff login). */
  listProducts(): Promise<ErpProduct[]>;
  /** Needs ERP change: no public stock endpoint exists. */
  getAvailability(skus: string[]): Promise<ErpAvailability[]>;
  /** EXISTS today: POST /api/order_create.php with a Bearer key. Reserves stock in the ERP in one transaction. */
  createOrder(order: ErpOrderRequest): Promise<ErpOrderCreated>;
  /** Needs ERP change: there is no endpoint to read an order's status back (dispatch, delivery, return). */
  getOrderStatus(erpOrderNo: string): Promise<ErpOrderStatus>;
};

export class ErpNotConfiguredError extends Error {
  constructor(what: string) {
    super(`ERP integration is not connected yet (${what}). See docs/ERP_INTEGRATION.md.`);
    this.name = "ErpNotConfiguredError";
  }
}

/** The adapter used until an integration is agreed: every call fails loudly instead of returning invented data. */
export const notConnectedErp: ErpPort = {
  listProducts: async () => { throw new ErpNotConfiguredError("catalogue"); },
  getAvailability: async () => { throw new ErpNotConfiguredError("stock"); },
  createOrder: async () => { throw new ErpNotConfiguredError("orders"); },
  getOrderStatus: async () => { throw new ErpNotConfiguredError("order status"); },
};
