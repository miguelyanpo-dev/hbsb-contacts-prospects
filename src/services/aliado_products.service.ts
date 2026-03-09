import type { Pool } from 'pg';
import { ConflictError } from '../utils/errors';

export class AliadoProductsService {
  // Obtener todos los productos aliados (solo item_id e item_combinated_names)
  static async getAll(db: Pool) {
    const { rows } = await db.query(
      `
      SELECT item_id, item_combinated_names
      FROM aliado_products
      WHERE deleted_at IS NULL
      ORDER BY item_combinated_names ASC
      `
    );
    return rows;
  }

  // Obtener productos aliados paginados con filtros
  static async getPaginated(
    db: Pool,
    filters: {
      page: number;
      limit: number;
      item_id?: string;
      item_code?: string;
      item_name?: string;
    }
  ) {
    const where: string[] = [];
    const values: any[] = [];

    if (filters.item_id) {
      values.push(filters.item_id);
      where.push(`item_id = $${values.length}`);
    }

    if (filters.item_code) {
      values.push(filters.item_code);
      where.push(`item_code = $${values.length}`);
    }

    if (filters.item_name) {
      values.push(`%${filters.item_name}%`);
      where.push(`item_name ILIKE $${values.length}`);
    }

    // Filtro para soft delete
    where.push(`deleted_at IS NULL`);

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*)::bigint AS total
      FROM aliado_products
      ${whereSql}
    `;
    const countResult = await db.query(countQuery, values);
    const total = Number(countResult.rows?.[0]?.total ?? 0);

    const offset = (filters.page - 1) * filters.limit;
    const valuesWithPaging = [...values, filters.limit, offset];

    const dataQuery = `
      SELECT *
      FROM aliado_products
      ${whereSql}
      ORDER BY updated_at DESC, created_at DESC
      LIMIT $${valuesWithPaging.length - 1}
      OFFSET $${valuesWithPaging.length}
    `;

    const { rows } = await db.query(dataQuery, valuesWithPaging);
    return { rows, total };
  }

  // Obtener producto aliado por ID
  static async getById(db: Pool, id: number) {
    const { rows } = await db.query(
      `SELECT * FROM aliado_products WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return rows[0];
  }

  // Crear nuevo producto aliado
static async create(db: Pool, data: any) {
  if (data.item_id) {
    const { rows: existingRows } = await db.query(
      `SELECT id FROM aliado_products WHERE item_id = $1 AND deleted_at IS NULL`,
      [data.item_id]
    );
    if (existingRows.length > 0) {
      throw new ConflictError('Ya existe un producto con este item_id');
    }
  }

  const { rows } = await db.query(
    `
    INSERT INTO aliado_products (
      item_id,
      item_code,
      item_name,
      item_image,
      item_description,
      item_cost,
      item_price_sell,
      item_rate_taxes,
      item_stock
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
    [
      data.item_id ?? null,
      data.item_code ?? null,
      data.item_name ?? null,
      data.item_image ?? null,
      data.item_description ?? null,
      data.item_cost ?? null,
      data.item_price_sell ?? null,
      data.item_rate_taxes ?? null,
      data.item_stock ?? null,
    ]
  );

  return rows[0];
}

  // Actualizar producto aliado
  static async update(db: Pool, id: number, data: any) {
  const { rows } = await db.query(
    `
    UPDATE aliado_products
    SET
      item_id = COALESCE($1, item_id),
      item_code = COALESCE($2, item_code),
      item_name = COALESCE($3, item_name),
      item_image = COALESCE($4, item_image),
      item_description = COALESCE($5, item_description),
      item_cost = COALESCE($6, item_cost),
      item_price_sell = COALESCE($7, item_price_sell),
      item_rate_taxes = COALESCE($8, item_rate_taxes),
      item_stock = COALESCE($9, item_stock),
      updated_at = now()
    WHERE id = $10 AND deleted_at IS NULL
    RETURNING *
    `,
    [
      data.item_id ?? null,
      data.item_code ?? null,
      data.item_name ?? null,
      data.item_image ?? null,
      data.item_description ?? null,
      data.item_cost ?? null,
      data.item_price_sell ?? null,
      data.item_rate_taxes ?? null,
      data.item_stock ?? null,
      id,
    ]
  );

  return rows[0];
}

  // Eliminar producto aliado (soft delete)
  static async deactivate(
    db: Pool,
    id: number
  ) {
    const { rows } = await db.query(
      `
      UPDATE aliado_products
      SET
        deleted_at = now()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
      `,
      [id]
    );

    return rows[0];
  }
}