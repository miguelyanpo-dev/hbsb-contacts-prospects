import { z } from 'zod';

// ─── Contact list item (simplified + city/region join) ────────────────────────

export const ContactListItemSchema = z.object({
  id_contact: z.string().uuid(),
  identification: z.string().nullable(),
  company_name: z.string().nullable(),
  contact_name: z.string().nullable(),
  phone_mobile: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  id_city: z.number().int().nullable(),
  city_name: z.string().nullable(),
  region_name: z.string().nullable(),
  created_at: z.string().nullable(),
  created_by_user_id: z.string().uuid().nullable(),
  updated_at: z.string().nullable(),
  updated_by_user_id: z.string().uuid().nullable(),
});

export type ContactListItem = z.infer<typeof ContactListItemSchema>;

// ─── Contact full detail schema (includes all fields + city/region) ────────────

export const ContactSchema = z.object({
  id_contact: z.string().uuid(),
  identification: z.string().nullable(),
  company_name: z.string().nullable(),
  contact_name: z.string().nullable(),
  phone_mobile: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  is_customer: z.boolean(),
  is_supplier: z.boolean(),
  is_employee: z.boolean(),
  is_seller: z.boolean(),
  is_in_external_software: z.boolean(),
  is_prospect: z.boolean(),
  is_in_my_followups: z.boolean(),
  is_in_reassigned: z.boolean(),
  is_excluded: z.boolean(),
  is_blacklisted: z.boolean(),
  id_seller: z.string().uuid().nullable(),
  id_status_customer: z.string().uuid().nullable(),
  id_status_prospect: z.string().uuid().nullable(),
  id_status_supplier: z.string().uuid().nullable(),
  id_status_employee: z.string().uuid().nullable(),
  id_status_seller: z.string().uuid().nullable(),
  id_city: z.number().int().nullable(),
  city_name: z.string().nullable(),
  region_name: z.string().nullable(),
  created_at: z.string().nullable(),
  created_by_user_id: z.string().uuid().nullable(),
  updated_at: z.string().nullable(),
  updated_by_user_id: z.string().uuid().nullable(),
  deleted_at: z.string().nullable(),
  deleted_by_user_id: z.string().uuid().nullable(),
});

export type Contact = z.infer<typeof ContactSchema>;

// ─── Route param schema ────────────────────────────────────────────────────────

export const ContactParamSchema = z.object({
  id: z.string().uuid('El ID del contacto debe ser un UUID válido'),
});

// ─── Shared ref schema (multi-tenant DB resolver) ─────────────────────────────

export const RefQuerySchema = z.object({
  ref: z.string().min(1, 'El parámetro ref es requerido'),
});

// ─── Query params schema (all strings; booleans are 'true'|'false') ───────────

export const ContactQuerySchema = z.object({
  ref:            z.string().min(1, 'El parámetro ref es requerido'),
  fields:         z.string().optional(),
  filters:        z.string().optional(),
  is_prospect:    z.enum(['true', 'false']).optional(),
  is_customer:    z.enum(['true', 'false']).optional(),
  is_in_my_followups: z.enum(['true', 'false']).optional(),
  is_in_reassigned: z.enum(['true', 'false']).optional(),
  is_excluded:    z.enum(['true', 'false']).optional(),
  is_blacklisted: z.enum(['true', 'false']).optional(),
  page:           z.string().regex(/^\d+$/, 'page debe ser un entero').optional(),
  limit:          z.string().regex(/^\d+$/, 'limit debe ser un entero').optional(),
  id_city:        z.union([z.string().regex(/^\d+$/, 'id_city debe ser un entero'), z.literal('')]).optional().openapi({ description: 'Filtrar por id de ciudad (vacío para no filtrar)' }),
  id_tag:         z.union([z.string().regex(/^\d+$/, 'id_tag debe ser un entero'), z.literal('')]).optional().openapi({ description: 'Filtrar por id de etiqueta (vacío para no filtrar)' }),
  iso_code:       z.string().optional().openapi({ description: 'Filtrar por código ISO de la región' }),
  seller:         z.string().optional().openapi({ description: 'JSON: {"id_contact": número} — mismo criterio que seller_id_contact (vía facturas)' }),
  seller_id_contact: z.union([z.string().regex(/^\d+$/, 'seller_id_contact debe ser un entero'), z.literal('')]).optional().openapi({ description: 'sellers.id_contact (entero); contactos con factura de ese vendedor' }),
  contact_name:   z.string().optional().openapi({ description: 'Filtrar por nombre del contacto (búsqueda parcial, case-insensitive)' }),
  identification: z.string().optional().openapi({ description: 'Filtrar por identificación (búsqueda parcial, case-insensitive)' }),
  phone_mobile:   z.string().optional().openapi({ description: 'Filtrar por teléfono móvil (búsqueda parcial, case-insensitive)' }),
  email:          z.string().optional().openapi({ description: 'Filtrar por email (búsqueda parcial, case-insensitive)' }),
});

export type ContactQueryRaw = z.infer<typeof ContactQuerySchema>;

export interface ContactFilters {
  is_prospect?: boolean;
  is_customer?: boolean;
  is_supplier?: boolean;
  is_employee?: boolean;
  is_seller_flag?: boolean;
  is_blacklisted?: boolean;
  is_excluded?: boolean;
  is_in_my_followups?: boolean;
  is_in_reassigned?: boolean;
  search?: string;
  contact_name?: string;
  identification?: string;
  phone_mobile?: string;
  email?: string;
  id_seller?: string;
  /** `public.sellers.id_contact` (entero). Filtra contactos con al menos una factura de ese vendedor. */
  seller_id_contact?: number;
  id_city?: number;
  id_tag?: number;
  iso_code?: string;
  fields?: string[];
  page: number;
  limit: number;
}

// ─── Create contact schema ─────────────────────────────────────────────────────

export const ContactCreateSchema = z.object({
  identification: z.string().max(50).optional(),
  company_name: z.string().max(200).optional(),
  contact_name: z.string().max(200).optional(),
  phone_mobile: z.string().max(20).optional(),
  email: z.string().email().max(150).optional(),
  address: z.string().max(300).optional(),
  is_customer: z.boolean().optional(),
  is_supplier: z.boolean().optional(),
  is_employee: z.boolean().optional(),
  is_seller: z.boolean().optional(),
  is_in_external_software: z.boolean().optional(),
  is_prospect: z.boolean().optional(),
  is_in_my_followups: z.boolean().optional(),
  is_in_reassigned: z.boolean().optional(),
  is_excluded: z.boolean().optional(),
  is_blacklisted: z.boolean().optional(),
  id_seller: z.string().uuid().nullable().optional(),
  id_status_customer: z.string().uuid().nullable().optional(),
  id_status_prospect: z.string().uuid().nullable().optional(),
  id_status_supplier: z.string().uuid().nullable().optional(),
  id_status_employee: z.string().uuid().nullable().optional(),
  id_status_seller: z.string().uuid().nullable().optional(),
  id_city: z.number().int().nullable().optional(),
  created_by_user_id: z.string().uuid().optional(),
});

export type ContactCreate = z.infer<typeof ContactCreateSchema>;

// ─── Update contact schema (all optional) ─────────────────────────────────────

export const ContactUpdateSchema = z.object({
  identification: z.string().max(50).optional(),
  company_name: z.string().max(200).optional(),
  contact_name: z.string().max(200).optional(),
  phone_mobile: z.string().max(20).optional(),
  email: z.string().email().max(150).optional(),
  address: z.string().max(300).optional(),
  is_customer: z.boolean().optional(),
  is_supplier: z.boolean().optional(),
  is_employee: z.boolean().optional(),
  is_seller: z.boolean().optional(),
  is_in_external_software: z.boolean().optional(),
  is_prospect: z.boolean().optional(),
  is_in_my_followups: z.boolean().optional(),
  is_in_reassigned: z.boolean().optional(),
  is_excluded: z.boolean().optional(),
  is_blacklisted: z.boolean().optional(),
  id_seller: z.string().uuid().nullable().optional(),
  id_status_customer: z.string().uuid().nullable().optional(),
  id_status_prospect: z.string().uuid().nullable().optional(),
  id_status_supplier: z.string().uuid().nullable().optional(),
  id_status_employee: z.string().uuid().nullable().optional(),
  id_status_seller: z.string().uuid().nullable().optional(),
  id_city: z.number().int().nullable().optional(),
  updated_by_user_id: z.string().uuid().optional(),
});

export type ContactUpdate = z.infer<typeof ContactUpdateSchema>;

// ─── Paginated response schema ─────────────────────────────────────────────────

export const PaginatedContactsSchema = z.object({
  success: z.boolean(),
  data: z.array(ContactListItemSchema),
  data_items: z.number(),
  page_current: z.number(),
  page_total: z.number(),
  have_next_page: z.boolean(),
  have_previous_page: z.boolean(),
  total_customers: z.number(),
  total_prospects: z.number(),
  total_nuevos: z.number(),
  total_en_contacto: z.number(),
  total_pendiente: z.number(),
  total_con_exito: z.number(),
  total_fallido: z.number(),
  total_seguimiento: z.number(),
  total_reasignados: z.number(),
  total_excluidos: z.number(),
  total_lista_negra: z.number(),
  total_customers_all: z.number().openapi({ description: 'Clientes (no prospectos), sin filtros de búsqueda' }),
  total_prospects_all: z.number().openapi({ description: 'Clientes prospectos, sin filtros de búsqueda' }),
  total_seguimiento_all: z.number().openapi({ description: 'Seguimiento, sin filtros de búsqueda' }),
  total_reasignados_all: z.number().openapi({ description: 'Reasignados, sin filtros de búsqueda' }),
  total_excluidos_all: z.number().openapi({ description: 'Excluidos, sin filtros de búsqueda' }),
  total_lista_negra_all: z.number().openapi({ description: 'Lista negra, sin filtros de búsqueda' }),
  total_calientes: z.number(),
  total_tibios: z.number(),
  total_frios: z.number(),
  total_dormidos: z.number(),
  total_perdidos: z.number(),
  total_mas_antiguos: z.number(),
});

export const SingleContactResponseSchema = z.object({
  success: z.boolean(),
  data: ContactSchema,
});

export const DeleteContactResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
