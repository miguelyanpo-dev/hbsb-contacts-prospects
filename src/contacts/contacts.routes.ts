import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { resolveDb } from '../utils/request.utils';
import { NotFoundError } from '../utils/errors';
import { ErrorResponse } from '../schemas/response.schemas';
import {
  ContactQuerySchema,
  ContactParamSchema,
  ContactCreateSchema,
  ContactUpdateSchema,
  PaginatedContactsSchema,
  SingleContactResponseSchema,
  DeleteContactResponseSchema,
  RefQuerySchema,
} from './contacts.schema';
import {
  listContacts,
  getContact,
  createNewContact,
  updateExistingContact,
  deleteContact,
} from './contacts.service';
import { jsonSafe } from '../utils/jsonSerialize';

// Handler return type cast needed due to @hono/zod-openapi v1.x / zod v4 inference limitations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (...args: any[]) => any;

const contacts = new OpenAPIHono();

// ─── GET /contacts ─────────────────────────────────────────────────────────────

const listContactsRoute = createRoute({
  method: 'get',
  path: '/contacts',
  tags: ['Contacts'],
  summary: 'Listar contactos prospectos/clientes',
  description:
    'Retorna una lista paginada de contactos. Por defecto filtra `is_prospect=true` y `is_customer=true`. ' +
    'El parámetro `ref` identifica la base de datos del tenant (ID del proyecto Supabase).',
  request: {
    query: ContactQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: PaginatedContactsSchema } },
      description: 'Lista paginada de contactos',
    },
    400: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'Parámetro ref requerido o inválido',
    },
    500: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'Error interno del servidor',
    },
  },
});

contacts.openapi(listContactsRoute, (async (c) => {
  const resolved = resolveDb(c);
  if (resolved.kind === 'error') return c.json(resolved.body, resolved.status);
  const { db } = resolved;

  try {
    const query = c.req.valid('query');
    const result = await listContacts(db, query);
    return c.json(jsonSafe(result) as typeof result, 200);
  } catch (err) {
    console.error('[GET /contacts]', err);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
}) as AnyHandler);

// ─── GET /contacts/:id ─────────────────────────────────────────────────────────

const getContactRoute = createRoute({
  method: 'get',
  path: '/contacts/{id}',
  tags: ['Contacts'],
  summary: 'Obtener un contacto por id_contact',
  request: {
    params: ContactParamSchema,
    query: RefQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SingleContactResponseSchema } },
      description: 'Contacto encontrado',
    },
    400: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'Parámetro ref requerido o ID inválido',
    },
    404: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'Contacto no encontrado',
    },
    500: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'Error interno del servidor',
    },
  },
});

contacts.openapi(getContactRoute, (async (c) => {
  const resolved = resolveDb(c);
  if (resolved.kind === 'error') return c.json(resolved.body, resolved.status);
  const { db } = resolved;

  try {
    const { id } = c.req.valid('param');
    const contact = await getContact(db, id);
    return c.json({ success: true, data: jsonSafe(contact) as typeof contact }, 200);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return c.json({ success: false, error: err.message }, 404);
    }
    console.error('[GET /contacts/:id]', err);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
}) as AnyHandler);

// ─── POST /contacts ────────────────────────────────────────────────────────────

const createContactRoute = createRoute({
  method: 'post',
  path: '/contacts',
  tags: ['Contacts'],
  summary: 'Crear un nuevo contacto',
  request: {
    query: RefQuerySchema,
    body: {
      content: { 'application/json': { schema: ContactCreateSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: SingleContactResponseSchema } },
      description: 'Contacto creado exitosamente',
    },
    400: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'Datos inválidos o ref requerido',
    },
    500: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'Error interno del servidor',
    },
  },
});

contacts.openapi(createContactRoute, (async (c) => {
  const resolved = resolveDb(c);
  if (resolved.kind === 'error') return c.json(resolved.body, resolved.status);
  const { db } = resolved;

  try {
    const body = c.req.valid('json');
    const contact = await createNewContact(db, body);
    return c.json({ success: true, data: jsonSafe(contact) as typeof contact }, 201);
  } catch (err) {
    console.error('[POST /contacts]', err);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
}) as AnyHandler);

// ─── PATCH /contacts/:id ───────────────────────────────────────────────────────

const updateContactRoute = createRoute({
  method: 'patch',
  path: '/contacts/{id}',
  tags: ['Contacts'],
  summary: 'Actualizar un contacto',
  request: {
    params: ContactParamSchema,
    query: RefQuerySchema,
    body: {
      content: { 'application/json': { schema: ContactUpdateSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SingleContactResponseSchema } },
      description: 'Contacto actualizado exitosamente',
    },
    400: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'Datos inválidos o ref requerido',
    },
    404: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'Contacto no encontrado',
    },
    500: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'Error interno del servidor',
    },
  },
});

contacts.openapi(updateContactRoute, (async (c) => {
  const resolved = resolveDb(c);
  if (resolved.kind === 'error') return c.json(resolved.body, resolved.status);
  const { db } = resolved;

  try {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const contact = await updateExistingContact(db, id, body);
    return c.json({ success: true, data: jsonSafe(contact) as typeof contact }, 200);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return c.json({ success: false, error: err.message }, 404);
    }
    console.error('[PATCH /contacts/:id]', err);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
}) as AnyHandler);

// ─── DELETE /contacts/:id ──────────────────────────────────────────────────────

const deleteContactRoute = createRoute({
  method: 'delete',
  path: '/contacts/{id}',
  tags: ['Contacts'],
  summary: 'Eliminar un contacto (soft delete)',
  description: 'Marca el contacto como eliminado sin borrar el registro físicamente.',
  request: {
    params: ContactParamSchema,
    query: z.object({
      ref: z.string().min(1, 'El parámetro ref es requerido'),
      deleted_by_user_id: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: DeleteContactResponseSchema } },
      description: 'Contacto eliminado exitosamente',
    },
    400: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'ref requerido o ID inválido',
    },
    404: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'Contacto no encontrado',
    },
    500: {
      content: { 'application/json': { schema: ErrorResponse } },
      description: 'Error interno del servidor',
    },
  },
});

contacts.openapi(deleteContactRoute, (async (c) => {
  const resolved = resolveDb(c);
  if (resolved.kind === 'error') return c.json(resolved.body, resolved.status);
  const { db } = resolved;

  try {
    const { id } = c.req.valid('param');
    const { deleted_by_user_id } = c.req.valid('query');
    await deleteContact(db, id, deleted_by_user_id);
    return c.json({ success: true, message: 'Contacto eliminado exitosamente' }, 200);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return c.json({ success: false, error: err.message }, 404);
    }
    console.error('[DELETE /contacts/:id]', err);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
}) as AnyHandler);

export default contacts;
