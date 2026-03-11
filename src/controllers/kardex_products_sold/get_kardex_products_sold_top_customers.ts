import type { Context } from 'hono';
import { GetKardexProductsSoldTopCustomersQuerySchema } from '../../schemas/products.schemas';
import { resolveDb } from '../../utils/request.utils';

export const getKardexProductsSoldTopCustomers = async (c: Context) => {
  const resolved = resolveDb(c);
  if (resolved.kind === 'error') return c.json(resolved.body, resolved.status);
  const { db } = resolved;

  const parsed = GetKardexProductsSoldTopCustomersQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Bad Request', message: parsed.error.message },
      400
    );
  }

  const { item_id } = parsed.data;
  const page = Number(parsed.data.page ?? 1);
  const limit = Number(parsed.data.limit ?? 5);
  const offset = (page - 1) * limit;

  try {
    // Totales globales (sin paginar)
    const { rows: totals } = await db.query(
      `
      SELECT
        COUNT(DISTINCT person_id)::int   AS cantidad_total_clientes,
        COALESCE(SUM(quantity), 0)::bigint AS cantidad_total_productos
      FROM kardex_products_sold
      WHERE item_id = $1
        AND deleted_at IS NULL
      `,
      [item_id]
    );

    const cantidad_total_clientes = Number(totals[0]?.cantidad_total_clientes ?? 0);
    const cantidad_total_productos = Number(totals[0]?.cantidad_total_productos ?? 0);

    // Clientes paginados ordenados de mayor a menor cantidad
    const { rows } = await db.query(
      `
      SELECT
        person_id,
        person_identification,
        person_name,
        SUM(quantity)::bigint AS total_quantity
      FROM kardex_products_sold
      WHERE item_id = $1
        AND deleted_at IS NULL
      GROUP BY person_id, person_identification, person_name
      ORDER BY total_quantity DESC
      LIMIT $2 OFFSET $3
      `,
      [item_id, limit, offset]
    );

    const page_total = Math.ceil(cantidad_total_clientes / limit);

    return c.json(
      {
        success: true,
        data: rows,
        data_items: cantidad_total_clientes,
        page_current: page,
        page_total,
        have_next_page: page < page_total,
        have_previous_page: page > 1,
        cantidad_total_clientes,
        cantidad_total_productos,
      },
      200
    );
  } catch (err) {
    console.error('getKardexProductsSoldTopCustomers error:', err);
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
  }
};
