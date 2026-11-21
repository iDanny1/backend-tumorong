import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';

export interface DocumentCustomerInput {
  customerId?: string;
  name?: unknown;
  phone?: unknown;
  address?: unknown;
  deliveryAddress?: unknown;
  departmentAddress?: unknown;
  contactName?: unknown;
  email?: unknown;
}

const fields = ['name', 'phone', 'address', 'deliveryAddress', 'departmentAddress', 'contactName', 'email'] as const;
const profileFields = [...fields, 'phoneRaw'] as const;
type Profile = Record<(typeof profileFields)[number], string>;
const text = (value: unknown) => typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/g, ' ') : '';
const canonical = (value: unknown) => text(value).toLocaleLowerCase('vi');
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function phone(value: unknown) {
  const raw = text(value);
  // Keep irregular/annotated contacts verbatim rather than guessing their digits.
  if (!/^\+?[\d\s().-]+$/.test(raw)) return canonical(raw);
  return raw.replace(/[\s().-]/g, '').replace(/^(?:\+84|84)(\d{9,10})$/, '0$1');
}

function normalized(input: DocumentCustomerInput): Profile {
  return {
    name: text(input.name), phone: phone(input.phone), phoneRaw: text(input.phone),
    address: text(input.address), deliveryAddress: text(input.deliveryAddress),
    departmentAddress: text(input.departmentAddress), contactName: text(input.contactName), email: text(input.email),
  };
}

const comparable = (profile: any, field: (typeof fields)[number]) => field === 'phone' ? phone(profile[field]) : canonical(profile[field]);
const signature = (profile: any) => createHash('sha256').update(JSON.stringify(fields.map(field => comparable(profile, field)))).digest('hex');
const hasDetails = (profile: any) => fields.slice(1).some(field => !!comparable(profile, field));

function compatible(existing: any, incoming: Profile, selected = false) {
  if (canonical(existing.name) !== canonical(incoming.name)) return false;
  for (const field of fields.slice(1)) {
    const stored = comparable(existing, field), next = comparable(incoming, field);
    if (stored && next && stored !== next) return false;
  }
  if (selected || !hasDetails(existing)) return true;
  // A name alone does not identify one of several people with that name. Require
  // another shared value when the existing record already contains details.
  return fields.slice(1).some(field => comparable(incoming, field)
    && comparable(incoming, field) === comparable(existing, field));
}

function snapshot(existing: any) {
  return Object.fromEntries(profileFields.map(field => [field,
    existing[field] == null || existing[field] === '' ? { $in: ['', null] } : existing[field],
  ]));
}

function duplicateKey(error: any) {
  return error?.code === 11000 && (!error.keyPattern || error.keyPattern.documentKeys);
}

/** Called only after a document is durable. Repeating this operation is safe. */
export async function syncDocumentCustomer(input: DocumentCustomerInput, model: any = Customer): Promise<any | null> {
  const incoming = normalized(input);
  if (!incoming.name) return null;
  await model.init();
  const key = signature(incoming);

  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      let existing: any = null;
      let explicitlySelected = false;
      if (input.customerId && mongoose.isValidObjectId(input.customerId)) {
        const selected = await model.findById(input.customerId);
        if (selected && compatible(selected, incoming, true)) {
          existing = selected;
          explicitlySelected = true;
        }
      }
      if (!existing) {
        const keyed = await model.findOne({ documentKeys: key });
        if (keyed) {
          // A later explicit edit may change a profile. Retire its stale alias
          // instead of attaching an old document to conflicting contact details.
          if (!compatible(keyed, incoming, true)) {
            await model.updateOne({ _id: keyed._id, ...snapshot(keyed) }, { $pull: { documentKeys: key } });
            continue;
          }
          return keyed;
        }
        const name = new RegExp(`^\\s*${incoming.name.split(' ').map(escapeRegex).join('\\s+')}\\s*$`, 'i');
        const candidates = (await model.find({ name })).filter((row: any) => compatible(row, incoming));
        const exact = candidates.filter((row: any) => signature(row) === key);
        // Identical legacy rows already describe the same observable profile.
        // Reuse a stable winner rather than compounding those duplicates.
        if (exact.length) existing = exact.sort((a: any, b: any) => String(a._id).localeCompare(String(b._id)))[0];
        else if (candidates.length === 1) existing = candidates[0];
      }

      if (existing) {
        const additions = Object.fromEntries(profileFields.filter(field => !text(existing[field]) && incoming[field])
          .map(field => [field, incoming[field]]));
        // Explicit selection is stronger than a partial-profile alias: two
        // distinct customers can have the same name-only quotation signature.
        if (explicitlySelected && !Object.keys(additions).length) return existing;
        // Compare all observed fields atomically. If someone filled a blank in
        // the meantime, retry matching instead of overwriting their value.
        const updated = await model.findOneAndUpdate(
          { _id: existing._id, ...snapshot(existing) },
          { ...(Object.keys(additions).length ? { $set: additions } : {}),
            ...(!explicitlySelected ? { $addToSet: { documentKeys: key } } : {}) },
          { new: true },
        );
        if (updated) return updated;
        continue;
      }

      // $in avoids a scalar documentKeys value being copied into an upsert.
      // The unique multikey index arbitrates concurrent first-time saves.
      const created = await model.findOneAndUpdate(
        { documentKeys: { $in: [key] } },
        { $setOnInsert: { ...incoming, documentKeys: [key] } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      if (created && compatible(created, incoming, true)) return created;
    } catch (error) {
      if (!duplicateKey(error)) throw error;
      // Another document registered this profile while this save was matching.
      // Re-read its indexed alias on the next iteration.
    }
  }
  throw new Error('Thông tin khách hàng đang được cập nhật. Vui lòng lưu lại phiếu.');
}

export function customerFromStockIssue(data: any): DocumentCustomerInput {
  const organizationName = data.isOrganization ? text(data.organizationName) : '';
  return {
    customerId: data.customerId,
    name: organizationName || data.recipient,
    contactName: organizationName ? data.recipient : '',
    phone: data.phone, address: data.address || (!organizationName ? data.deliveryAddress : ''),
    deliveryAddress: data.deliveryAddress,
  };
}

export function customerFromQuote(data: any): DocumentCustomerInput {
  return { customerId: data.customerId, name: data.customerName };
}

export function customerFromOrder(data: any): DocumentCustomerInput {
  return {
    customerId: data.customerId,
    name: data.customerName || data.customer?.name,
    phone: data.customerPhone || data.customer?.phone,
    address: data.address || data.customer?.address,
    deliveryAddress: data.customer?.deliveryAddress || data.deliveryAddress,
    departmentAddress: data.customer?.departmentAddress,
    contactName: data.customer?.contactName,
    email: data.customer?.email || data.email,
  };
}
