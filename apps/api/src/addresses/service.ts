import type { ResultSetHeader } from "mysql2/promise";
import { inTransaction, type Db } from "../db.js";
import { HttpError, notFound } from "../errors.js";
import type { AddressInput } from "../validation.js";

const maxAddresses = 10;

type Row = {
  id: number | string; type: "Home" | "Office" | "Other"; label: string; recipient_name: string; phone: string; house: string;
  street: string; city: string; state: string; pincode: string; is_default: number;
};

/** The shape the website's checkout already uses (SavedAddress in apps/web/src/lib/checkout.ts). */
export type AddressDto = {
  id: string; type: Row["type"]; label: string; isDefault: boolean; name: string; phone: string;
  house: string; street: string; city: string; state: string; pincode: string;
};

const columns = "id, type, label, recipient_name, phone, house, street, city, state, pincode, is_default";

export const toDto = (row: Row): AddressDto => ({
  id: String(row.id),
  type: row.type,
  label: row.label || row.type,
  isDefault: row.is_default === 1,
  name: row.recipient_name,
  phone: `+91 ${row.phone}`,
  house: row.house,
  street: row.street,
  city: row.city,
  state: row.state,
  pincode: row.pincode,
});

// the label is only stored when it is a custom one ("PG"); otherwise the list shows the type
const storedLabel = (input: AddressInput) => (input.label === input.type ? "" : input.label);

export type AddressService = ReturnType<typeof createAddressService>;

/** Every query is scoped to `customerId`, so one customer can never read or change another one's addresses. */
export function createAddressService(db: Db) {
  const list = async (customerId: string) => {
    const [rows] = await db.execute(`SELECT ${columns} FROM shop_customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, id ASC`, [customerId]);
    return (rows as Row[]).map(toDto);
  };

  const one = async (customerId: string, id: string) => {
    const [rows] = await db.execute(`SELECT ${columns} FROM shop_customer_addresses WHERE customer_id = ? AND id = ?`, [customerId, id]);
    const row = (rows as Row[])[0];
    if (!row) throw notFound("We could not find that address. It may have been deleted.");
    return toDto(row);
  };

  return {
    list,

    async create(customerId: string, input: AddressInput): Promise<AddressDto> {
      const id = await inTransaction(db, async (connection) => {
        const [counted] = await connection.execute("SELECT COUNT(*) AS total FROM shop_customer_addresses WHERE customer_id = ? FOR UPDATE", [customerId]);
        const total = Number((counted as { total: number }[])[0]?.total ?? 0);
        if (total >= maxAddresses) throw new HttpError(422, `You can save up to ${maxAddresses} addresses. Please delete one to add another.`);
        // the first address is the default; later ones only if asked
        const makeDefault = total === 0 || input.isDefault === true;
        if (makeDefault) await connection.execute("UPDATE shop_customer_addresses SET is_default = 0 WHERE customer_id = ?", [customerId]);
        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO shop_customer_addresses (customer_id, type, label, recipient_name, phone, house, street, city, state, pincode, is_default)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [customerId, input.type, storedLabel(input), input.name, input.phone, input.house, input.street, input.city, input.state, input.pincode, makeDefault ? 1 : 0],
        );
        return result.insertId;
      });
      return one(customerId, String(id));
    },

    async update(customerId: string, id: string, input: AddressInput): Promise<AddressDto> {
      await inTransaction(db, async (connection) => {
        if (input.isDefault === true) await connection.execute("UPDATE shop_customer_addresses SET is_default = 0 WHERE customer_id = ?", [customerId]);
        const [result] = await connection.execute<ResultSetHeader>(
          `UPDATE shop_customer_addresses
              SET type = ?, label = ?, recipient_name = ?, phone = ?, house = ?, street = ?, city = ?, state = ?, pincode = ?,
                  is_default = IF(? = 1, 1, is_default)
            WHERE customer_id = ? AND id = ?`,
          [input.type, storedLabel(input), input.name, input.phone, input.house, input.street, input.city, input.state, input.pincode, input.isDefault === true ? 1 : 0, customerId, id],
        );
        if (result.affectedRows === 0) throw notFound("We could not find that address. It may have been deleted.");
      });
      return one(customerId, id);
    },

    async remove(customerId: string, id: string): Promise<void> {
      await inTransaction(db, async (connection) => {
        const [rows] = await connection.execute("SELECT is_default FROM shop_customer_addresses WHERE customer_id = ? AND id = ? FOR UPDATE", [customerId, id]);
        const row = (rows as { is_default: number }[])[0];
        if (!row) throw notFound("We could not find that address. It may have been deleted.");
        await connection.execute("DELETE FROM shop_customer_addresses WHERE customer_id = ? AND id = ?", [customerId, id]);
        // if the default went, the newest remaining address takes its place
        if (row.is_default === 1) {
          await connection.execute("UPDATE shop_customer_addresses SET is_default = 1 WHERE customer_id = ? ORDER BY id DESC LIMIT 1", [customerId]);
        }
      });
    },

    async setDefault(customerId: string, id: string): Promise<AddressDto[]> {
      await inTransaction(db, async (connection) => {
        const [rows] = await connection.execute("SELECT id FROM shop_customer_addresses WHERE customer_id = ? AND id = ? FOR UPDATE", [customerId, id]);
        if (!(rows as unknown[]).length) throw notFound("We could not find that address. It may have been deleted.");
        await connection.execute("UPDATE shop_customer_addresses SET is_default = IF(id = ?, 1, 0) WHERE customer_id = ?", [id, customerId]);
      });
      return list(customerId);
    },
  };
}
