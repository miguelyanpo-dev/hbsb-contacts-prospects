import type { Pool } from 'pg';
import { NotFoundError } from '../utils/errors';
import { buildPaginatedResponse } from '../utils/request.utils';
import type { ContactCreate, ContactFilters, ContactQueryRaw, ContactUpdate } from './contacts.schema';
import {
  findAllContacts,
  findContactById,
  createContact,
  updateContact,
  softDeleteContact,
  FIELD_MAP,
} from './contacts.repository';

// ─── Boolean filter keys ───────────────────────────────────────────────────────

const BOOLEAN_FILTER_KEYS = new Set([
  'is_prospect',
  'is_customer',
  'is_supplier',
  'is_employee',
  'is_seller',
  'is_blacklisted',
  'is_excluded',
  'is_in_my_followups',
]);

// ─── Parse filters string into ContactFilters (without page/limit/fields) ─────
// Format: "key:value,key:value"
// Unknown keys are silently ignored.
// Values with commas are not supported in search terms.

export function parseFiltersString(
  raw?: string,
): Omit<ContactFilters, 'fields' | 'page' | 'limit'> {
  const result: Omit<ContactFilters, 'fields' | 'page' | 'limit'> = {
    is_prospect: true,
    is_customer: true,
  };

  if (!raw) return result;

  for (const pair of raw.split(',')) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) continue;

    const key = pair.slice(0, colonIdx).trim();
    const value = pair.slice(colonIdx + 1).trim();

    if (BOOLEAN_FILTER_KEYS.has(key)) {
      const boolVal = value === 'true';
      if (key === 'is_seller') {
        result.is_seller_flag = boolVal;
      } else {
        (result as Record<string, unknown>)[key] = boolVal;
      }
    } else if (key === 'id_city') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) result.id_city = parsed;
    } else if (key === 'id_seller') {
      result.id_seller = value;
    } else if (key === 'search') {
      result.search = value;
    }
    // Unknown keys: ignored
  }

  return result;
}

// ─── Parse fields string into validated column names ──────────────────────────
// Format: "col1,col2,col3"
// Names not in FIELD_MAP are silently ignored.
// Returns [] when omitted — signals "use default LIST_SELECT".

export function parseFieldsString(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((f) => f.trim())
    .filter((f) => f in FIELD_MAP);
}

// ─── List contacts ─────────────────────────────────────────────────────────────

export async function listContacts(db: Pool, rawQuery: ContactQueryRaw) {
  const filtersBase = parseFiltersString(rawQuery.filters);
  const fields = parseFieldsString(rawQuery.fields);
  const page = rawQuery.page !== undefined ? Math.max(1, parseInt(rawQuery.page, 10)) : 1;
  const limit =
    rawQuery.limit !== undefined ? Math.min(100, Math.max(1, parseInt(rawQuery.limit, 10))) : 20;

  const filters: ContactFilters = {
    ...filtersBase,
    fields: fields.length > 0 ? fields : undefined,
    page,
    limit,
  };

  const { rows, total } = await findAllContacts(db, filters);
  return buildPaginatedResponse(rows, total, page, limit);
}

// ─── Get single contact ────────────────────────────────────────────────────────

export async function getContact(db: Pool, id: string) {
  const contact = await findContactById(db, id);
  if (!contact) {
    throw new NotFoundError(`Contacto con id "${id}" no encontrado`);
  }
  return contact;
}

// ─── Create contact ────────────────────────────────────────────────────────────

export async function createNewContact(db: Pool, data: ContactCreate) {
  return createContact(db, data);
}

// ─── Update contact ────────────────────────────────────────────────────────────

export async function updateExistingContact(db: Pool, id: string, data: ContactUpdate) {
  const updated = await updateContact(db, id, data);
  if (!updated) {
    throw new NotFoundError(`Contacto con id "${id}" no encontrado`);
  }
  return updated;
}

// ─── Delete contact (soft) ────────────────────────────────────────────────────

export async function deleteContact(db: Pool, id: string, deletedByUserId?: string) {
  const deleted = await softDeleteContact(db, id, deletedByUserId);
  if (!deleted) {
    throw new NotFoundError(`Contacto con id "${id}" no encontrado`);
  }
}
