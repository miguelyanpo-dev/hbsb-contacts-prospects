import type { Pool } from 'pg';
import type { ContactFilters, ContactCreate, ContactUpdate } from './contacts.schema';

const SELECT_COLUMNS = `
  id_contact,
  identification,
  company_name,
  contact_name,
  phone_mobile,
  email,
  address,
  is_customer,
  is_supplier,
  is_employee,
  is_seller,
  is_in_external_software,
  is_prospect,
  is_in_my_followups,
  is_in_reassigned,
  is_excluded,
  is_blacklisted,
  id_seller,
  id_status_customer,
  id_status_prospect,
  id_status_supplier,
  id_status_employee,
  id_status_seller,
  id_city,
  created_at,
  created_by_user_id,
  updated_at,
  updated_by_user_id,
  deleted_at,
  deleted_by_user_id
`;

// ─── Find all contacts (paginated + filtered) ──────────────────────────────────

export async function findAllContacts(db: Pool, filters: ContactFilters) {
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];
  let idx = 1;

  conditions.push(`is_prospect = $${idx++}`);
  params.push(filters.is_prospect);

  conditions.push(`is_customer = $${idx++}`);
  params.push(filters.is_customer);

  if (filters.is_supplier !== undefined) {
    conditions.push(`is_supplier = $${idx++}`);
    params.push(filters.is_supplier);
  }

  if (filters.is_employee !== undefined) {
    conditions.push(`is_employee = $${idx++}`);
    params.push(filters.is_employee);
  }

  if (filters.is_seller_flag !== undefined) {
    conditions.push(`is_seller = $${idx++}`);
    params.push(filters.is_seller_flag);
  }

  if (filters.is_blacklisted !== undefined) {
    conditions.push(`is_blacklisted = $${idx++}`);
    params.push(filters.is_blacklisted);
  }

  if (filters.is_excluded !== undefined) {
    conditions.push(`is_excluded = $${idx++}`);
    params.push(filters.is_excluded);
  }

  if (filters.is_in_my_followups !== undefined) {
    conditions.push(`is_in_my_followups = $${idx++}`);
    params.push(filters.is_in_my_followups);
  }

  if (filters.id_seller) {
    conditions.push(`id_seller = $${idx++}`);
    params.push(filters.id_seller);
  }

  if (filters.id_city !== undefined) {
    conditions.push(`id_city = $${idx++}`);
    params.push(filters.id_city);
  }

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    const p = idx++;
    conditions.push(
      `(contact_name ILIKE $${p} OR company_name ILIKE $${p} OR identification ILIKE $${p} OR email ILIKE $${p} OR phone_mobile ILIKE $${p})`
    );
    params.push(pattern);
  }

  const where = conditions.join(' AND ');
  const offset = (filters.page - 1) * filters.limit;

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM public.contacts WHERE ${where}`,
    params
  );
  const total: number = countResult.rows[0]?.total ?? 0;

  const dataResult = await db.query(
    `SELECT ${SELECT_COLUMNS}
     FROM public.contacts
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, offset]
  );

  return { rows: dataResult.rows, total };
}

// ─── Find one contact by PK ───────────────────────────────────────────────────

export async function findContactById(db: Pool, id: string) {
  const result = await db.query(
    `SELECT ${SELECT_COLUMNS}
     FROM public.contacts
     WHERE id_contact = $1 AND deleted_at IS NULL`,
    [id]
  );
  return result.rows[0] ?? null;
}

// ─── Create contact ────────────────────────────────────────────────────────────

export async function createContact(db: Pool, data: ContactCreate) {
  const columns: string[] = [];
  const placeholders: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const fields: Array<[string, unknown]> = [
    ['identification', data.identification],
    ['company_name', data.company_name],
    ['contact_name', data.contact_name],
    ['phone_mobile', data.phone_mobile],
    ['email', data.email],
    ['address', data.address],
    ['is_customer', data.is_customer ?? false],
    ['is_supplier', data.is_supplier ?? false],
    ['is_employee', data.is_employee ?? false],
    ['is_seller', data.is_seller ?? false],
    ['is_in_external_software', data.is_in_external_software ?? false],
    ['is_prospect', data.is_prospect ?? true],
    ['is_in_my_followups', data.is_in_my_followups ?? false],
    ['is_in_reassigned', data.is_in_reassigned ?? false],
    ['is_excluded', data.is_excluded ?? false],
    ['is_blacklisted', data.is_blacklisted ?? false],
    ['id_seller', data.id_seller],
    ['id_status_customer', data.id_status_customer],
    ['id_status_prospect', data.id_status_prospect],
    ['id_status_supplier', data.id_status_supplier],
    ['id_status_employee', data.id_status_employee],
    ['id_status_seller', data.id_status_seller],
    ['id_city', data.id_city],
    ['created_by_user_id', data.created_by_user_id],
  ];

  for (const [col, val] of fields) {
    if (val !== undefined) {
      columns.push(col);
      placeholders.push(`$${idx++}`);
      params.push(val);
    }
  }

  const result = await db.query(
    `INSERT INTO public.contacts (${columns.join(', ')})
     VALUES (${placeholders.join(', ')})
     RETURNING ${SELECT_COLUMNS}`,
    params
  );
  return result.rows[0];
}

// ─── Update contact ────────────────────────────────────────────────────────────

export async function updateContact(db: Pool, id: string, data: ContactUpdate) {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const fields: Array<[string, unknown]> = [
    ['identification', data.identification],
    ['company_name', data.company_name],
    ['contact_name', data.contact_name],
    ['phone_mobile', data.phone_mobile],
    ['email', data.email],
    ['address', data.address],
    ['is_customer', data.is_customer],
    ['is_supplier', data.is_supplier],
    ['is_employee', data.is_employee],
    ['is_seller', data.is_seller],
    ['is_in_external_software', data.is_in_external_software],
    ['is_prospect', data.is_prospect],
    ['is_in_my_followups', data.is_in_my_followups],
    ['is_in_reassigned', data.is_in_reassigned],
    ['is_excluded', data.is_excluded],
    ['is_blacklisted', data.is_blacklisted],
    ['id_seller', data.id_seller],
    ['id_status_customer', data.id_status_customer],
    ['id_status_prospect', data.id_status_prospect],
    ['id_status_supplier', data.id_status_supplier],
    ['id_status_employee', data.id_status_employee],
    ['id_status_seller', data.id_status_seller],
    ['id_city', data.id_city],
    ['updated_by_user_id', data.updated_by_user_id],
  ];

  for (const [col, val] of fields) {
    if (val !== undefined) {
      setClauses.push(`${col} = $${idx++}`);
      params.push(val);
    }
  }

  if (setClauses.length === 0) return null;

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  const result = await db.query(
    `UPDATE public.contacts
     SET ${setClauses.join(', ')}
     WHERE id_contact = $${idx} AND deleted_at IS NULL
     RETURNING ${SELECT_COLUMNS}`,
    params
  );
  return result.rows[0] ?? null;
}

// ─── Soft delete contact ───────────────────────────────────────────────────────

export async function softDeleteContact(db: Pool, id: string, deletedByUserId?: string) {
  const params: unknown[] = [id];
  let userClause = '';

  if (deletedByUserId) {
    params.push(deletedByUserId);
    userClause = `, deleted_by_user_id = $2`;
  }

  const result = await db.query(
    `UPDATE public.contacts
     SET deleted_at = NOW()${userClause}
     WHERE id_contact = $1 AND deleted_at IS NULL
     RETURNING id_contact`,
    params
  );
  return result.rows[0] ?? null;
}
