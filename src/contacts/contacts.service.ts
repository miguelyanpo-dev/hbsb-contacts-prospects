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
  'is_in_reassigned',
]);

// ─── Parse filters string into ContactFilters (without page/limit/fields) ─────
// Format: "key:value,key:value"
// Unknown keys are silently ignored.
// Values with commas are not supported in search terms.

export function parseFiltersString(
  raw?: string,
): Omit<ContactFilters, 'fields' | 'page' | 'limit'> {
  const result: Omit<ContactFilters, 'fields' | 'page' | 'limit'> = {};

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
    } else if (key === 'id_tag') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) result.id_tag = parsed;
    } else if (key === 'id_seller') {
      result.id_seller = value;
    } else if (key === 'seller_id_contact') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) result.seller_id_contact = parsed;
    } else if (key === 'seller') {
      try {
        const obj = JSON.parse(value) as unknown;
        if (obj !== null && typeof obj === 'object' && 'id_contact' in obj) {
          const v = (obj as { id_contact: unknown }).id_contact;
          if (typeof v === 'number' && Number.isInteger(v)) {
            result.seller_id_contact = v;
          } else if (typeof v === 'string' && /^\d+$/.test(v)) {
            result.seller_id_contact = parseInt(v, 10);
          }
        }
      } catch {
        /* invalid JSON ignored */
      }
    } else if (key === 'iso_code') {
      result.iso_code = value;
    } else if (key === 'search') {
      result.search = value;
    } else if (key === 'contact_name') {
      result.contact_name = value;
    } else if (key === 'identification') {
      result.identification = value;
    } else if (key === 'phone_mobile') {
      result.phone_mobile = value;
    } else if (key === 'email') {
      result.email = value;
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

  if (rawQuery.is_prospect !== undefined) {
    filtersBase.is_prospect = rawQuery.is_prospect === 'true';
  }
  if (rawQuery.is_customer !== undefined) {
    filtersBase.is_customer = rawQuery.is_customer === 'true';
  }
  if (rawQuery.is_in_my_followups !== undefined) {
    filtersBase.is_in_my_followups = rawQuery.is_in_my_followups === 'true';
  }
  if (rawQuery.is_in_reassigned !== undefined) {
    filtersBase.is_in_reassigned = rawQuery.is_in_reassigned === 'true';
  }
  if (rawQuery.is_excluded !== undefined) {
    filtersBase.is_excluded = rawQuery.is_excluded === 'true';
  }
  if (rawQuery.is_blacklisted !== undefined) {
    filtersBase.is_blacklisted = rawQuery.is_blacklisted === 'true';
  }
  if (rawQuery.contact_name)   filtersBase.contact_name   = rawQuery.contact_name;
  if (rawQuery.identification) filtersBase.identification = rawQuery.identification;
  if (rawQuery.phone_mobile)   filtersBase.phone_mobile   = rawQuery.phone_mobile;
  if (rawQuery.email)          filtersBase.email          = rawQuery.email;
  if (rawQuery.id_city !== undefined) {
    const parsedCityId = parseInt(rawQuery.id_city, 10);
    if (!isNaN(parsedCityId)) filtersBase.id_city = parsedCityId;
  }
  if (rawQuery.id_tag !== undefined) {
    const parsedTagId = parseInt(rawQuery.id_tag, 10);
    if (!isNaN(parsedTagId)) filtersBase.id_tag = parsedTagId;
  }
  if (rawQuery.iso_code)       filtersBase.iso_code       = rawQuery.iso_code;

  if (rawQuery.seller) {
    try {
      const obj = JSON.parse(rawQuery.seller) as unknown;
      if (
        obj !== null &&
        typeof obj === 'object' &&
        'id_contact' in obj
      ) {
        const v = (obj as { id_contact: unknown }).id_contact;
        if (typeof v === 'number' && Number.isInteger(v)) {
          filtersBase.seller_id_contact = v;
        } else if (typeof v === 'string' && /^\d+$/.test(v)) {
          filtersBase.seller_id_contact = parseInt(v, 10);
        }
      }
    } catch {
      /* invalid JSON ignored */
    }
  }
  if (rawQuery.seller_id_contact !== undefined && rawQuery.seller_id_contact !== '') {
    const parsed = parseInt(rawQuery.seller_id_contact, 10);
    if (!isNaN(parsed)) filtersBase.seller_id_contact = parsed;
  }

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

  const {
    rows, total,
    total_customers, total_prospects,
    total_nuevos, total_en_contacto, total_pendiente, total_con_exito, total_fallido,
    total_seguimiento,
    total_reasignados,
    total_excluidos,
    total_lista_negra,
    total_customers_all,
    total_prospects_all,
    total_seguimiento_all,
    total_reasignados_all,
    total_excluidos_all,
    total_lista_negra_all,
    total_calientes,
    total_tibios,
    total_frios,
    total_dormidos,
    total_perdidos,
    total_mas_antiguos,
  } = await findAllContacts(db, filters);
  return {
    ...buildPaginatedResponse(rows, total, page, limit),
    total_customers,
    total_prospects,
    total_nuevos,
    total_en_contacto,
    total_pendiente,
    total_con_exito,
    total_fallido,
    total_seguimiento,
    total_reasignados,
    total_excluidos,
    total_lista_negra,
    total_customers_all,
    total_prospects_all,
    total_seguimiento_all,
    total_reasignados_all,
    total_excluidos_all,
    total_lista_negra_all,
    total_calientes,
    total_tibios,
    total_frios,
    total_dormidos,
    total_perdidos,
    total_mas_antiguos,
  };
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
