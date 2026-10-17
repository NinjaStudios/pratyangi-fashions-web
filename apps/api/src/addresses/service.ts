import type { Address } from "@prisma/client";
import type { Db } from "../db.js";
import { HttpError, notFound } from "../errors.js";
import type { AddressInput } from "../validation.js";

const maxAddresses = 10;
const gone = () => notFound("We could not find that address. It may have been deleted.");

/** The shape the website's checkout already uses (SavedAddress in apps/web/src/lib/checkout.ts). */
export type AddressDto = {
  id: string; type: "Home" | "Office" | "Other"; label: string; isDefault: boolean; name: string; phone: string; alternatePhone?: string;
  house: string; street: string; city: string; state: string; pincode: string;
};

export const toDto = (row: Address): AddressDto => ({
  id: String(row.id),
  type: row.type as AddressDto["type"],
  label: row.label || row.type,
  isDefault: row.isDefault,
  name: row.recipientName,
  phone: `+91 ${row.phone}`,
  ...(row.alternatePhone ? { alternatePhone: `+91 ${row.alternatePhone}` } : {}),
  house: row.house,
  street: row.street,
  city: row.city,
  state: row.state,
  pincode: row.pincode,
});

// the label is only stored when it is a custom one ("PG"); otherwise the list shows the type
const columns = (input: AddressInput) => ({
  type: input.type,
  label: input.label === input.type ? "" : input.label,
  recipientName: input.name,
  phone: input.phone,
  alternatePhone: input.alternatePhone || null,
  house: input.house,
  street: input.street,
  city: input.city,
  state: input.state,
  pincode: input.pincode,
});

export type AddressService = ReturnType<typeof createAddressService>;

/** Every query is scoped to `customerId`, so one customer can never read or change another one's addresses. */
export function createAddressService(db: Db) {
  const list = async (customerId: number) => (await db.address.findMany({ where: { customerId }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] })).map(toDto);

  return {
    list,

    async create(customerId: number, input: AddressInput): Promise<AddressDto> {
      const created = await db.$transaction(async (tx) => {
        // lock this customer's row so two simultaneous saves cannot both slip past the limit or both become the default
        await tx.$queryRaw`SELECT id FROM shop_customers WHERE id = ${customerId} FOR UPDATE`;
        const total = await tx.address.count({ where: { customerId } });
        if (total >= maxAddresses) throw new HttpError(422, `You can save up to ${maxAddresses} addresses. Please delete one to add another.`);
        // the first address is the default; later ones only if asked
        const makeDefault = total === 0 || input.isDefault === true;
        if (makeDefault) await tx.address.updateMany({ where: { customerId }, data: { isDefault: false } });
        return tx.address.create({ data: { customerId, ...columns(input), isDefault: makeDefault } });
      });
      return toDto(created);
    },

    async update(customerId: number, id: number, input: AddressInput): Promise<AddressDto> {
      const updated = await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM shop_customers WHERE id = ${customerId} FOR UPDATE`;
        if (!(await tx.address.findFirst({ where: { id, customerId }, select: { id: true } }))) throw gone();
        if (input.isDefault === true) await tx.address.updateMany({ where: { customerId }, data: { isDefault: false } });
        return tx.address.update({ where: { id }, data: { ...columns(input), ...(input.isDefault === true ? { isDefault: true } : {}) } });
      });
      return toDto(updated);
    },

    async remove(customerId: number, id: number): Promise<void> {
      await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM shop_customers WHERE id = ${customerId} FOR UPDATE`;
        const row = await tx.address.findFirst({ where: { id, customerId } });
        if (!row) throw gone();
        await tx.address.delete({ where: { id } });
        // if the default went, the newest remaining address takes its place
        if (row.isDefault) {
          const newest = await tx.address.findFirst({ where: { customerId }, orderBy: { id: "desc" }, select: { id: true } });
          if (newest) await tx.address.update({ where: { id: newest.id }, data: { isDefault: true } });
        }
      });
    },

    async setDefault(customerId: number, id: number): Promise<AddressDto[]> {
      await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM shop_customers WHERE id = ${customerId} FOR UPDATE`;
        if (!(await tx.address.findFirst({ where: { id, customerId }, select: { id: true } }))) throw gone();
        await tx.address.updateMany({ where: { customerId }, data: { isDefault: false } });
        await tx.address.update({ where: { id }, data: { isDefault: true } });
      });
      return list(customerId);
    },
  };
}
