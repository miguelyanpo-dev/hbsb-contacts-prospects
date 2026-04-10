# fields & filters Query Parameters — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat query string on `GET /contacts` with `fields=col1,col2` and `filters=key:value,key:value`, keeping `page` and `limit` as top-level params.

**Architecture:** Parse `filters` string into the existing `ContactFilters` shape inside the service layer; validate `fields` against a whitelist constant in the repository; pass validated column names through `ContactFilters.fields` to build a dynamic SELECT in `findAllContacts`. No new files — all changes are surgical edits to four existing files.

**Tech Stack:** TypeScript, Hono, Zod, PostgreSQL (pg), vitest (added in Task 1)

---

## File Map

| File | What changes |
|------|-------------|
| `package.json` | Add `vitest` devDependency + `test` script |
| `vitest.config.ts` | New — minimal vitest config |
| `src/contacts/contacts.schema.ts` | Simplify `ContactQuerySchema` (5 params); add `fields?` to `ContactFilters` |
| `src/contacts/contacts.repository.ts` | Export `FIELD_MAP`; update `findAllContacts` for dynamic SELECT |
| `src/contacts/contacts.service.ts` | Replace `parseContactFilters` → `parseFiltersString`; add `parseFieldsString`; update `listContacts` |
| `src/contacts/contacts.routes.ts` | No handler logic change — schema change propagates automatically |
| `src/contacts/__tests__/contacts.service.test.ts` | New — unit tests for both parsing functions |

---

## Task 1: Set up vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest**

```bash
cd /path/to/hbsb-contacts-prospects
npm install --save-dev vitest
```

Expected: vitest appears in `node_modules` and `package.json` devDependencies.

- [ ] **Step 2: Add test script to `package.json`**

Open `package.json`. In the `"scripts"` section, add one line:

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "vercel-build": "echo 'Building for Vercel...' && tsc --project tsconfig.build.json || echo 'Build completed with warnings'",
  "start": "node dist/index.js",
  "type-check": "tsc --noEmit",
  "test": "vitest run"
}
```

- [ ] **Step 3: Create `vitest.config.ts` at the project root**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 4: Verify vitest runs (no tests yet)**

```bash
npm test
```

Expected output contains: `No test files found` or `0 tests passed`. No errors about config.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for unit testing"
```

---

## Task 2: Update `contacts.schema.ts`

**Files:**
- Modify: `src/contacts/contacts.schema.ts`

- [ ] **Step 1: Replace `ContactQuerySchema` and `ContactFilters`**

Open `src/contacts/contacts.schema.ts`.

Replace the entire `ContactQuerySchema` block (currently lines 77–93) with:

```ts
export const ContactQuerySchema = z.object({
  ref:     z.string().min(1, 'El parámetro ref es requerido'),
  fields:  z.string().optional(),
  filters: z.string().optional(),
  page:    z.string().regex(/^\d+$/, 'page debe ser un entero').optional(),
  limit:   z.string().regex(/^\d+$/, 'limit debe ser un entero').optional(),
});

export type ContactQueryRaw = z.infer<typeof ContactQuerySchema>;
```

Replace the `ContactFilters` interface (currently lines 97–111) with:

```ts
export interface ContactFilters {
  is_prospect: boolean;
  is_customer: boolean;
  is_supplier?: boolean;
  is_employee?: boolean;
  is_seller_flag?: boolean;
  is_blacklisted?: boolean;
  is_excluded?: boolean;
  is_in_my_followups?: boolean;
  search?: string;
  id_seller?: string;
  id_city?: number;
  fields?: string[];
  page: number;
  limit: number;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run type-check
```

Expected: exits 0 (no errors). If there are errors they will be in `contacts.service.ts` because `parseContactFilters` references the old individual fields — those are fixed in Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/contacts/contacts.schema.ts
git commit -m "refactor(schema): simplify ContactQuerySchema to fields/filters/page/limit"
```

---

## Task 3: Export `FIELD_MAP` from repository

**Files:**
- Modify: `src/contacts/contacts.repository.ts`

This must happen before the service is implemented, because `contacts.service.ts` imports `FIELD_MAP` from the repository.

- [ ] **Step 1: Add `FIELD_MAP` export after the `CITY_JOINS` constant**

Open `src/contacts/contacts.repository.ts`. After the `CITY_JOINS` constant (around line 67), add:

```ts
// ─── Field whitelist for dynamic SELECT ───────────────────────────────────────
// Keys = query param names. Values = SQL expressions (code constants, never user input).

export const FIELD_MAP: Record<string, string> = {
  id_contact:         'c.id_contact',
  identification:     'c.identification',
  company_name:       'c.company_name',
  contact_name:       'c.contact_name',
  phone_mobile:       'c.phone_mobile',
  email:              'c.email',
  address:            'c.address',
  id_city:            'c.id_city',
  city_name:          'ci.city_name',
  region_name:        'r.region_name',
  created_at:         'c.created_at',
  created_by_user_id: 'c.created_by_user_id',
  updated_at:         'c.updated_at',
  updated_by_user_id: 'c.updated_by_user_id',
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run type-check
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/contacts/contacts.repository.ts
git commit -m "feat: export FIELD_MAP from contacts.repository"
```

---

## Task 4: Write failing tests for `parseFiltersString` and `parseFieldsString`

**Files:**
- Create: `src/contacts/__tests__/contacts.service.test.ts`

- [ ] **Step 1: Create the test file**

```bash
mkdir -p src/contacts/__tests__
```

Create `src/contacts/__tests__/contacts.service.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseFiltersString, parseFieldsString } from '../contacts.service';

describe('parseFiltersString', () => {
  it('returns defaults when raw is undefined', () => {
    expect(parseFiltersString(undefined)).toEqual({ is_prospect: true, is_customer: true });
  });

  it('returns defaults when raw is empty string', () => {
    expect(parseFiltersString('')).toEqual({ is_prospect: true, is_customer: true });
  });

  it('parses boolean filter to true', () => {
    const result = parseFiltersString('is_prospect:true');
    expect(result.is_prospect).toBe(true);
  });

  it('parses boolean filter to false', () => {
    const result = parseFiltersString('is_customer:false');
    expect(result.is_customer).toBe(false);
  });

  it('parses multiple filters', () => {
    const result = parseFiltersString('is_prospect:true,is_customer:false,is_supplier:true');
    expect(result.is_prospect).toBe(true);
    expect(result.is_customer).toBe(false);
    expect(result.is_supplier).toBe(true);
  });

  it('maps is_seller to is_seller_flag', () => {
    const result = parseFiltersString('is_seller:true');
    expect(result.is_seller_flag).toBe(true);
  });

  it('parses id_city as integer', () => {
    const result = parseFiltersString('id_city:42');
    expect(result.id_city).toBe(42);
  });

  it('ignores id_city when value is not a number', () => {
    const result = parseFiltersString('id_city:abc');
    expect(result.id_city).toBeUndefined();
  });

  it('parses search as string', () => {
    const result = parseFiltersString('search:acme corp');
    expect(result.search).toBe('acme corp');
  });

  it('parses id_seller as string', () => {
    const result = parseFiltersString('id_seller:550e8400-e29b-41d4-a716-446655440000');
    expect(result.id_seller).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('ignores unknown keys silently', () => {
    const result = parseFiltersString('unknown_key:value');
    expect(result).toEqual({ is_prospect: true, is_customer: true });
  });

  it('ignores pairs without a colon', () => {
    const result = parseFiltersString('is_prospect:true,malformed');
    expect(result.is_prospect).toBe(true);
  });
});

describe('parseFieldsString', () => {
  it('returns empty array when raw is undefined', () => {
    expect(parseFieldsString(undefined)).toEqual([]);
  });

  it('returns empty array when raw is empty string', () => {
    expect(parseFieldsString('')).toEqual([]);
  });

  it('returns valid field names', () => {
    expect(parseFieldsString('id_contact,email,phone_mobile')).toEqual([
      'id_contact',
      'email',
      'phone_mobile',
    ]);
  });

  it('filters out unknown field names', () => {
    expect(parseFieldsString('id_contact,unknown_col,email')).toEqual([
      'id_contact',
      'email',
    ]);
  });

  it('trims whitespace around field names', () => {
    expect(parseFieldsString(' id_contact , email ')).toEqual([
      'id_contact',
      'email',
    ]);
  });

  it('allows JOIN-backed fields city_name and region_name', () => {
    expect(parseFieldsString('city_name,region_name')).toEqual([
      'city_name',
      'region_name',
    ]);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: Tests fail with errors like `parseFiltersString is not a function` or similar — the functions do not exist yet. `FIELD_MAP` IS already exported (Task 3), so no import error.

---

## Task 5: Implement `parseFiltersString` and `parseFieldsString` in service

**Files:**
- Modify: `src/contacts/contacts.service.ts`

- [ ] **Step 1: Replace `parseContactFilters` and update `listContacts`**

Open `src/contacts/contacts.service.ts`. Replace the entire file with:

```ts
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
```

- [ ] **Step 2: Run tests — verify they pass**

```bash
npm test
```

Expected: all tests pass. If `FIELD_MAP` is not yet exported from repository, you will see an import error — that is fixed in Task 5 Step 1.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run type-check
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/contacts/__tests__/contacts.service.test.ts src/contacts/contacts.service.ts
git commit -m "feat: implement parseFiltersString and parseFieldsString with tests"
```

---

## Task 6: Update `contacts.repository.ts` — dynamic SELECT in `findAllContacts`

**Files:**
- Modify: `src/contacts/contacts.repository.ts`

`FIELD_MAP` is already exported (added in Task 3). This task only updates `findAllContacts` to use it.

- [ ] **Step 1: Add dynamic SELECT to `findAllContacts`**

Open `src/contacts/contacts.repository.ts`. In `findAllContacts`, replace the `dataResult` query so it uses a dynamic SELECT when `filters.fields` is provided. Change these lines:

```ts
// BEFORE — fixed SELECT
  const dataResult = await db.query(
    `SELECT ${LIST_SELECT}
     FROM public.contacts c
     ${CITY_JOINS}
     WHERE ${where}
     ORDER BY c.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, offset]
  );
```

```ts
// AFTER — dynamic SELECT when fields are requested
  const selectClause =
    filters.fields && filters.fields.length > 0
      ? filters.fields.map((f) => `${FIELD_MAP[f]} AS ${f}`).join(', ')
      : LIST_SELECT;

  const dataResult = await db.query(
    `SELECT ${selectClause}
     FROM public.contacts c
     ${CITY_JOINS}
     WHERE ${where}
     ORDER BY c.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, offset]
  );
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass (parsing tests don't hit the DB, so they are unaffected).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run type-check
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/contacts/contacts.repository.ts
git commit -m "feat: dynamic SELECT in findAllContacts using FIELD_MAP"
```

---

## Task 7: Smoke test

No DB credentials are expected in this environment, so the test verifies the app boots and the route shape is correct.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected: `El servidor está corriendo en http://localhost:3001`

- [ ] **Step 2: Verify OpenAPI docs reflect new params**

```bash
curl http://localhost:3001/api/v1/openapi.json | grep -A5 '"filters"'
```

Expected: JSON output showing `filters` as an optional string parameter, NOT the old individual boolean params.

- [ ] **Step 3: Verify new query format is accepted**

```bash
curl "http://localhost:3001/api/v1/contacts?ref=test&filters=is_prospect:true&fields=id_contact,email&page=1&limit=5"
```

Expected: `400` error (missing or invalid DB ref) or `200` with data if ref is valid. The important thing is that the request is **not rejected by Zod validation** — a `400` from the DB layer is correct behavior without real credentials.

- [ ] **Step 4: Verify old individual params are rejected**

```bash
curl "http://localhost:3001/api/v1/contacts?ref=test&is_prospect=true"
```

Expected: The old `is_prospect` param is simply ignored (not validated by Zod anymore) — the request proceeds normally using `filters` defaults.

- [ ] **Step 5: Commit final state**

```bash
git add -A
git commit -m "feat: fields & filters query params on GET /contacts"
```

---

## Notes

- **Search values with commas** are not supported in the `filters` string (e.g., `filters=search:Smith,Jones` splits incorrectly). Users must avoid commas in search terms or URL-encode the entire `filters` value. This is a known limitation.
- `GET /contacts/:id` always returns full detail — `fields` has no effect on it.
- `POST`, `PATCH`, `DELETE` are unaffected.
