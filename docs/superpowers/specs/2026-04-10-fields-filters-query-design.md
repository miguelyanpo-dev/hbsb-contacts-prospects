# Design: `fields` & `filters` query parameters

**Date:** 2026-04-10
**Scope:** `GET /contacts` endpoint only
**Status:** Approved

---

## Goal

Replace the current flat query string (13 individual boolean/string params) with a
compact, structured format:

```
GET /contacts?ref=xxx&fields=id_contact,contact_name,email&filters=is_prospect:true,search:acme&page=1&limit=20
```

---

## Query format

### `ref` (unchanged)
Supabase project ID used to resolve the tenant database pool.

### `fields` (new, optional)
Comma-separated list of column names to include in each row of the response.

- Valid names are defined by `FIELD_MAP` in the repository (whitelist).
- JOIN-backed fields (`city_name`, `region_name`) are valid and mapped internally.
- Unknown names are ignored silently.
- If omitted, the current default `LIST_SELECT` columns are returned.

Example: `fields=id_contact,contact_name,email,city_name`

### `filters` (new, optional)
Comma-separated `key:value` pairs.

- Valid keys: `is_prospect`, `is_customer`, `is_supplier`, `is_employee`, `is_seller`,
  `is_blacklisted`, `is_excluded`, `is_in_my_followups`, `search`, `id_seller`, `id_city`
- Values are coerced to the appropriate type per key:
  - Boolean keys (`is_*`): `"true"` → `true`, anything else → `false`
  - `id_city`: parsed as integer
  - `id_seller`: used as-is (UUID string)
  - `search`: used as-is (string)
- Unknown keys are ignored silently.
- If omitted, defaults apply: `is_prospect=true`, `is_customer=true` (same as today).

Example: `filters=is_prospect:true,search:acme,id_city:5`

### `page` and `limit` (unchanged)
Remain as top-level query params. Defaults: `page=1`, `limit=20`, max `limit=100`.

---

## Architecture

### Schema layer (`contacts.schema.ts`)

`ContactQuerySchema` is simplified from 13 params to 5:

```ts
export const ContactQuerySchema = z.object({
  ref:     z.string().min(1),
  fields:  z.string().optional(),
  filters: z.string().optional(),
  page:    z.string().regex(/^\d+$/).optional(),
  limit:   z.string().regex(/^\d+$/).optional(),
});
```

`ContactFilters` gains one new optional field:

```ts
export interface ContactFilters {
  // ... existing boolean/string filter fields unchanged ...
  fields?: string[];  // validated column names for dynamic SELECT
  page: number;
  limit: number;
}
```

### Service layer (`contacts.service.ts`)

`parseContactFilters(raw: ContactQueryRaw)` is replaced by two functions:

- `parseFiltersString(raw?: string): Omit<ContactFilters, 'fields' | 'page' | 'limit'>`
  Parses the `filters` query string into typed filter values.

- `parseFieldsString(raw?: string): string[]`
  Parses the `fields` query string, validates against `FIELD_MAP` keys, returns
  an empty array if omitted (signals "use defaults").

`listContacts()` calls both and merges the result before calling the repository.

### Repository layer (`contacts.repository.ts`)

A new constant is added:

```ts
const FIELD_MAP: Record<string, string> = {
  id_contact:           'c.id_contact',
  identification:       'c.identification',
  company_name:         'c.company_name',
  contact_name:         'c.contact_name',
  phone_mobile:         'c.phone_mobile',
  email:                'c.email',
  address:              'c.address',
  id_city:              'c.id_city',
  city_name:            'ci.city_name',
  region_name:          'r.region_name',
  created_at:           'c.created_at',
  created_by_user_id:   'c.created_by_user_id',
  updated_at:           'c.updated_at',
  updated_by_user_id:   'c.updated_by_user_id',
};
```

`findAllContacts(db, filters, fields?)` signature is updated:
- If `fields` is non-empty, builds `SELECT` from `FIELD_MAP` values (never raw user input).
- If `fields` is empty/undefined, falls back to `LIST_SELECT` (no change in behavior).

User-supplied field names are **never interpolated directly into SQL**. Only
pre-defined `FIELD_MAP` values (code constants) are used in the query.

### Route layer (`contacts.routes.ts`)

The handler for `GET /contacts` extracts `fields` and `filters` from the validated
query and passes them to `listContacts()`. No other routes change.

---

## Files changed

| File | Change |
|------|--------|
| `src/contacts/contacts.schema.ts` | Simplify `ContactQuerySchema`; add `fields` to `ContactFilters` |
| `src/contacts/contacts.service.ts` | Replace `parseContactFilters`; add `parseFieldsString` |
| `src/contacts/contacts.repository.ts` | Add `FIELD_MAP`; update `findAllContacts` signature |
| `src/contacts/contacts.routes.ts` | Pass `fields` from query to service |

---

## Breaking changes

The individual query params (`is_prospect`, `is_customer`, `search`, `id_seller`, etc.)
are removed. Callers must migrate to the `filters=key:value` format.

---

## Out of scope

- `GET /contacts/:id` — always returns full detail, `fields` does not apply.
- `POST`, `PATCH`, `DELETE` — unaffected.
- Operators beyond equality (e.g., `id_city:gt:5`) — not included.
- Nested filters or OR logic — not included.
