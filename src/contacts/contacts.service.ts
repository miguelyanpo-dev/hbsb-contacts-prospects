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
} from './contacts.repository';

// ─── Parse raw query params into typed filters ─────────────────────────────────

export function parseContactFilters(raw: ContactQueryRaw): ContactFilters {
  return {
    is_prospect: raw.is_prospect !== undefined ? raw.is_prospect === 'true' : true,
    is_customer: raw.is_customer !== undefined ? raw.is_customer === 'true' : true,
    is_supplier: raw.is_supplier !== undefined ? raw.is_supplier === 'true' : undefined,
    is_employee: raw.is_employee !== undefined ? raw.is_employee === 'true' : undefined,
    is_seller_flag: raw.is_seller !== undefined ? raw.is_seller === 'true' : undefined,
    is_blacklisted: raw.is_blacklisted !== undefined ? raw.is_blacklisted === 'true' : undefined,
    is_excluded: raw.is_excluded !== undefined ? raw.is_excluded === 'true' : undefined,
    is_in_my_followups: raw.is_in_my_followups !== undefined ? raw.is_in_my_followups === 'true' : undefined,
    search: raw.search,
    id_seller: raw.id_seller,
    id_city: raw.id_city !== undefined ? parseInt(raw.id_city, 10) : undefined,
    page: raw.page !== undefined ? Math.max(1, parseInt(raw.page, 10)) : 1,
    limit: raw.limit !== undefined ? Math.min(100, Math.max(1, parseInt(raw.limit, 10))) : 20,
  };
}

// ─── List contacts ─────────────────────────────────────────────────────────────

export async function listContacts(db: Pool, rawQuery: ContactQueryRaw) {
  const filters = parseContactFilters(rawQuery);
  const { rows, total } = await findAllContacts(db, filters);
  return buildPaginatedResponse(rows, total, filters.page, filters.limit);
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
