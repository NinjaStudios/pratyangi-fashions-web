import type { SavedAddress } from "./checkout";

/** What the address dialog hands over: a full address, with an `id` when an existing one is being edited. */
export type AddressDraft = Omit<SavedAddress, "id"> & { id?: string };

/** An expected, customer-facing failure. `errors` has one message per input when the server named them (keys match the dialog's fields). */
export class AddressError extends Error {
  constructor(message: string, public errors?: Record<string, string>) {
    super(message);
    this.name = "AddressError";
  }
}

/** The customer's saved addresses. Signed-in customers use the store API; the demo keeps them in memory. */
export type AddressBook = {
  list(): Promise<SavedAddress[]>;
  save(draft: AddressDraft): Promise<SavedAddress>;
  remove(id: string): Promise<void>;
  setDefault(id: string): Promise<SavedAddress[]>;
};

/** The real address book: endpoints `/addresses` of the store API (see apps/api). The session cookie says whose it is. */
export function createApiAddressBook(baseUrl: string): AddressBook {
  async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: init?.method ?? "GET",
        credentials: "include",
        headers: init?.body ? { "Content-Type": "application/json" } : undefined,
        body: init?.body ? JSON.stringify(init.body) : undefined,
      });
    } catch {
      throw new AddressError("We could not reach the server. Check your connection and try again.");
    }
    if (response.status === 204) return undefined as T;
    const data = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string> } & T;
    if (response.status === 401) throw new AddressError("Your session has ended. Please sign in again.");
    if (!response.ok) throw new AddressError(data.message ?? "Something went wrong. Please try again.", data.errors);
    return data;
  }

  return {
    list: async () => (await call<{ addresses: SavedAddress[] }>("/addresses")).addresses,
    save: async ({ id, ...address }) =>
      (await (id
        ? call<{ address: SavedAddress }>(`/addresses/${encodeURIComponent(id)}`, { method: "PUT", body: address })
        : call<{ address: SavedAddress }>("/addresses", { method: "POST", body: address }))).address,
    remove: async (id) => {
      await call(`/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    setDefault: async (id) => (await call<{ addresses: SavedAddress[] }>(`/addresses/${encodeURIComponent(id)}/default`, { method: "POST" })).addresses,
  };
}

/** Demo address book (no server): lives in memory for the visit, starting from the sample addresses in the design. */
export function createMemoryAddressBook(seed: SavedAddress[]): AddressBook {
  let addresses = seed.map((address) => ({ ...address }));
  return {
    list: async () => addresses.map((address) => ({ ...address })),
    save: async (draft) => {
      const id = draft.id ?? `new-${Date.now()}`;
      const next: SavedAddress = { ...draft, id };
      const index = addresses.findIndex((address) => address.id === id);
      const others = addresses.filter((address) => address.id !== id).map((address) => (next.isDefault ? { ...address, isDefault: false } : address));
      // an edited address stays where it was in the list; a new one goes to the end
      addresses = index === -1 ? [...others, next] : [...others.slice(0, index), next, ...others.slice(index)];
      return next;
    },
    remove: async (id) => {
      addresses = addresses.filter((address) => address.id !== id);
    },
    setDefault: async (id) => {
      addresses = addresses.map((address) => ({ ...address, isDefault: address.id === id }));
      return addresses.map((address) => ({ ...address }));
    },
  };
}
