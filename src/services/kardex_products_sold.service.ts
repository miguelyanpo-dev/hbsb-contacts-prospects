import type { Pool } from 'pg';

export class KardexProductsSoldService {
  // Obtener todos los productos vendidos
  static async getAll(db: Pool) {
    const { rows } = await db.query(
      `
      SELECT *
      FROM kardex_products_sold
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      `
    );
    return rows;
  }

  // Obtener productos vendidos paginados con filtros
  static async getPaginated(
    db: Pool,
    filters: {
      page: number;
      limit: number;
      invoice_id?: string;
      person_id?: string;
      item_id?: string;
      date_start?: string;
      date_end?: string;
    }
  ) {
    const where: string[] = [];
    const values: any[] = [];

    if (filters.invoice_id) {
      values.push(filters.invoice_id);
      where.push(`invoice_id = $${values.length}`);
    }

    if (filters.person_id) {
      values.push(filters.person_id);
      where.push(`person_id = $${values.length}`);
    }

    if (filters.item_id) {
      values.push(filters.item_id);
      where.push(`item_id = $${values.length}`);
    }

    if (filters.date_start) {
      values.push(filters.date_start);
      where.push(`invoice_date >= $${values.length}::date`);
    }

    if (filters.date_end) {
      values.push(filters.date_end);
      where.push(`invoice_date <= $${values.length}::date`);
    }

    // Filtro para soft delete
    where.push(`deleted_at IS NULL`);

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*)::bigint AS total
      FROM kardex_products_sold
      ${whereSql}
    `;
    const countResult = await db.query(countQuery, values);
    const total = Number(countResult.rows?.[0]?.total ?? 0);

    const offset = (filters.page - 1) * filters.limit;
    const valuesWithPaging = [...values, filters.limit, offset];

    const dataQuery = `
      SELECT *
      FROM kardex_products_sold
      ${whereSql}
      ORDER BY updated_at DESC, created_at DESC
      LIMIT $${valuesWithPaging.length - 1}
      OFFSET $${valuesWithPaging.length}
    `;

    const { rows } = await db.query(dataQuery, valuesWithPaging);
    return { rows, total };
  }

  // Obtener producto vendido por ID
  static async getById(db: Pool, id: number) {
    const { rows } = await db.query(
      `SELECT * FROM kardex_products_sold WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return rows[0];
  }

  // Crear nuevo producto vendido
  static async create(db: Pool, data: any) {
    // Validar si invoice_id e item_id ya existen
    if (data.invoice_id && data.item_id) {
      const { rows: existingRows } = await db.query(
        `
        SELECT id FROM kardex_products_sold 
        WHERE invoice_id = $1 AND item_id = $2 AND deleted_at IS NULL
        `,
        [data.invoice_id, data.item_id]
      );

      if (existingRows.length > 0) {
        throw new Error('Ya existe un registro con este invoice_id e item_id');
      }
    }

    const { rows } = await db.query(
      `
      INSERT INTO kardex_products_sold (
        invoice_id,
        invoice_date,
        person_id,
        person_identification,
        person_name,
        item_id,
        item_code,
        item_name,
        quantity,
        unit_value,
        subtotal_amount
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING *
      `,
      [
        data.invoice_id ?? null,
        data.invoice_date ?? null,
        data.person_id ?? null,
        data.person_identification ?? null,
        data.person_name ?? null,
        data.item_id ?? null,
        data.item_code ?? null,
        data.item_name ?? null,
        data.quantity ?? null,
        data.unit_value ?? null,
        data.subtotal_amount ?? null,
      ]
    );

    return rows[0];
  }

  // Actualizar producto vendido
  static async update(db: Pool, id: number, data: any) {
    const { rows } = await db.query(
      `
      UPDATE kardex_products_sold
      SET
        invoice_id = COALESCE($1, invoice_id),
        invoice_date = COALESCE($2, invoice_date),
        person_id = COALESCE($3, person_id),
        person_identification = COALESCE($4, person_identification),
        person_name = COALESCE($5, person_name),
        item_id = COALESCE($6, item_id),
        item_code = COALESCE($7, item_code),
        item_name = COALESCE($8, item_name),
        quantity = COALESCE($9, quantity),
        unit_value = COALESCE($10, unit_value),
        subtotal_amount = COALESCE($11, subtotal_amount),
        updated_at = now()
      WHERE id = $12 AND deleted_at IS NULL
      RETURNING *
      `,
      [
        data.invoice_id ?? null,
        data.invoice_date ?? null,
        data.person_id ?? null,
        data.person_identification ?? null,
        data.person_name ?? null,
        data.item_id ?? null,
        data.item_code ?? null,
        data.item_name ?? null,
        data.quantity ?? null,
        data.unit_value ?? null,
        data.subtotal_amount ?? null,
        id,
      ]
    );

    return rows[0];
  }

  // Eliminar producto vendido (soft delete)
  static async deactivate(
    db: Pool,
    id: number
  ) {
    const { rows } = await db.query(
      `
      UPDATE kardex_products_sold
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