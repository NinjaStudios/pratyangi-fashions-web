import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { browser, db, makeApp, person, resetDatabase } from "./helpers.js";

beforeEach(resetDatabase);
afterAll(() => db.$disconnect());

const home = {
  type: "Home",
  label: "",
  name: "Priya Rao",
  phone: "98765 43210",
  house: "12-3-45",
  street: "Road No. 5, Banjara Hills",
  city: "Hyderabad",
  state: "Telangana",
  pincode: "500034",
};

async function signedInClient(n = 1) {
  const { app } = makeApp();
  const me = browser(app);
  await me.post("/auth/signup", person(n));
  return { app, me };
}

describe("address book needs a signed-in customer", () => {
  it("answers 401 to everything without a session", async () => {
    const { app } = makeApp();
    const guest = browser(app);
    expect((await guest.get("/addresses")).status).toBe(401);
    expect((await guest.post("/addresses", home)).status).toBe(401);
    expect((await guest.put("/addresses/1", home)).status).toBe(401);
    expect((await guest.delete("/addresses/1")).status).toBe(401);
    expect((await guest.post("/addresses/1/default")).status).toBe(401);
  });
});

describe("saving addresses", () => {
  it("saves an address in the shape the checkout uses, and the first one becomes the default", async () => {
    const { me } = await signedInClient();
    const created = await me.post("/addresses", home);
    expect(created.status).toBe(201);
    expect(created.body.address).toMatchObject({
      type: "Home", label: "Home", isDefault: true, name: "Priya Rao", phone: "+91 9876543210",
      house: "12-3-45", street: "Road No. 5, Banjara Hills", city: "Hyderabad", state: "Telangana", pincode: "500034",
    });
    const list = await me.get("/addresses");
    expect(list.body.addresses).toHaveLength(1);
  });

  it("keeps the delivery mobile separate from the account: it can be any valid number", async () => {
    const { me } = await signedInClient();
    const a = await me.post("/addresses", { ...home, phone: "+91 98765-43210" });
    const b = await me.post("/addresses", { ...home, type: "Office", label: "Shop", phone: "09123456789" });
    expect(a.body.address.phone).toBe("+91 9876543210");
    expect(b.body.address.phone).toBe("+91 9123456789");
    expect(b.body.address.label).toBe("Shop");
    expect(Object.keys(Prisma.CustomerScalarFieldEnum)).not.toContain("phone");
  });

  it("says exactly what is wrong with each field", async () => {
    const { me } = await signedInClient();
    const empty = await me.post("/addresses", {});
    expect(empty.status).toBe(422);
    expect(empty.body.errors).toEqual({
      type: "Choose Home, Office or Other.",
      name: "Enter the recipient's full name.",
      phone: "Enter the delivery mobile number.",
      house: "Enter the house, flat or building number.",
      street: "Enter the street, area or landmark.",
      city: "Enter the city.",
      state: "Choose the state.",
      pincode: "Enter the 6-digit PIN code.",
    });

    const bad = await me.post("/addresses", { ...home, phone: "12345", pincode: "012345", state: "Atlantis", name: "P" });
    expect(bad.body.errors).toEqual({
      name: "Enter the recipient's full name (at least 2 characters).",
      phone: "Enter a valid 10-digit mobile number that starts with 6, 7, 8 or 9.",
      state: "Choose the state from the list.",
      pincode: "Enter a valid 6-digit PIN code (it cannot start with 0).",
    });
    expect((await me.post("/addresses", { ...home, phone: "5876543210" })).body.errors.phone).toMatch(/starts with 6, 7, 8 or 9/);
    expect((await me.post("/addresses", { ...home, pincode: "5000" })).body.errors.pincode).toMatch(/valid 6-digit PIN/);
    expect((await me.get("/addresses")).body.addresses).toHaveLength(0);
  });

  it("keeps an optional alternate number, checks it, and lets it be removed", async () => {
    const { me } = await signedInClient();
    const created = await me.post("/addresses", { ...home, alternatePhone: "+91 91234 56789" });
    expect(created.body.address.alternatePhone).toBe("+91 9123456789");
    expect((await me.post("/addresses", { ...home, alternatePhone: "123" })).body.errors.alternatePhone).toBe("Enter a valid 10-digit alternate number that starts with 6, 7, 8 or 9, or leave it empty.");
    const cleared = await me.put(`/addresses/${created.body.address.id}`, { ...home, alternatePhone: "" });
    expect(cleared.body.address.alternatePhone).toBeUndefined();
    expect((await me.post("/addresses", home)).body.address.alternatePhone).toBeUndefined();
  });

  it("lets exactly ten of many simultaneous saves through", async () => {
    const { me } = await signedInClient();
    const results = await Promise.all(Array.from({ length: 14 }, () => me.post("/addresses", home)));
    expect(results.filter((res) => res.status === 201)).toHaveLength(10);
    expect(results.filter((res) => res.status === 422)).toHaveLength(4);
    const list = (await me.get("/addresses")).body.addresses;
    expect(list).toHaveLength(10);
    expect(list.filter((address: { isDefault: boolean }) => address.isDefault)).toHaveLength(1);
  });

  it("allows at most ten addresses", async () => {
    const { me } = await signedInClient();
    for (let i = 0; i < 10; i++) expect((await me.post("/addresses", home)).status).toBe(201);
    const eleventh = await me.post("/addresses", home);
    expect(eleventh.status).toBe(422);
    expect(eleventh.body.message).toBe("You can save up to 10 addresses. Please delete one to add another.");
  });
});

describe("default address", () => {
  it("moves when another is chosen or created as default, and is handed on when the default is deleted", async () => {
    const { me } = await signedInClient();
    const a = (await me.post("/addresses", home)).body.address;
    const b = (await me.post("/addresses", { ...home, type: "Office" })).body.address;
    expect(b.isDefault).toBe(false);

    const switched = await me.post(`/addresses/${b.id}/default`);
    expect(switched.body.addresses.map((address: { id: string; isDefault: boolean }) => [address.id, address.isDefault])).toEqual([[b.id, true], [a.id, false]]);

    const c = (await me.post("/addresses", { ...home, type: "Other", label: "PG", isDefault: true })).body.address;
    const defaults = (await me.get("/addresses")).body.addresses.filter((address: { isDefault: boolean }) => address.isDefault);
    expect(defaults.map((address: { id: string }) => address.id)).toEqual([c.id]);

    expect((await me.delete(`/addresses/${c.id}`)).status).toBe(204);
    const after = (await me.get("/addresses")).body.addresses;
    expect(after).toHaveLength(2);
    expect(after.filter((address: { isDefault: boolean }) => address.isDefault)).toHaveLength(1);
  });

  it("edits an address", async () => {
    const { me } = await signedInClient();
    const a = (await me.post("/addresses", home)).body.address;
    const edited = await me.put(`/addresses/${a.id}`, { ...home, city: "Secunderabad", label: "Studio", type: "Office" });
    expect(edited.status).toBe(200);
    expect(edited.body.address).toMatchObject({ id: a.id, city: "Secunderabad", label: "Studio", type: "Office", isDefault: true });
    expect((await me.put(`/addresses/${a.id}`, { ...home, pincode: "abc" })).status).toBe(422);
  });
});

describe("one customer can never touch another's addresses", () => {
  it("hides, refuses to edit, and refuses to delete somebody else's address", async () => {
    const { app, me: priya } = await signedInClient(1);
    const mine = (await priya.post("/addresses", home)).body.address;

    const other = browser(app);
    await other.post("/auth/signup", person(2));
    expect((await other.get("/addresses")).body.addresses).toEqual([]);
    expect((await other.put(`/addresses/${mine.id}`, { ...home, name: "Intruder" })).status).toBe(404);
    expect((await other.delete(`/addresses/${mine.id}`)).status).toBe(404);
    expect((await other.post(`/addresses/${mine.id}/default`)).status).toBe(404);

    const still = (await priya.get("/addresses")).body.addresses;
    expect(still).toHaveLength(1);
    expect(still[0].name).toBe("Priya Rao");
  });

  it("does not trust an address id that is not a number", async () => {
    const { me } = await signedInClient();
    expect((await me.put("/addresses/1%20OR%201=1", home)).status).toBe(404);
    expect((await me.delete("/addresses/abc")).status).toBe(404);
  });
});
