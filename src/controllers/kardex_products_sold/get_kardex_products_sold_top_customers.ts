import type { Context } from 'hono';
import { GetKardexProductsSoldTopCustomersQuerySchema } from '../../schemas/products.schemas';
import { resolveDb } from '../../utils/request.utils';

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#F43F5E', '#A855F7', '#22C55E', '#EAB308',
  '#0EA5E9', '#D97706', '#DC2626', '#7C3AED', '#16A34A',
];

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
  const page  = Number(parsed.data.page  ?? 1);
  const limit = Number(parsed.data.limit ?? 5);
  const offset = (page - 1) * limit;

  try {
    // ── Totales globales (sin paginar) ──────────────────────────────────────
    const { rows: totals } = await db.query(
      `
      SELECT
        COUNT(DISTINCT person_id)::int     AS cantidad_total_clientes,
        COALESCE(SUM(quantity), 0)::bigint AS cantidad_total_productos
      FROM kardex_products_sold
      WHERE item_id = $1
        AND deleted_at IS NULL
      `,
      [item_id]
    );

    const cantidad_total_clientes  = Number(totals[0]?.cantidad_total_clientes  ?? 0);
    const cantidad_total_productos = Number(totals[0]?.cantidad_total_productos ?? 0);

    // ── Clientes paginados + datos mensuales (últimos 12 meses) ────────────
    const { rows } = await db.query(
      `
      WITH months AS (
        SELECT
          month_start::date,
          (ROW_NUMBER() OVER (ORDER BY month_start) - 1)::int AS month_index
        FROM generate_series(
          DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
          DATE_TRUNC('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) AS month_start
      ),
      ranked_customers AS (
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
      )
      SELECT
        rc.person_id,
        rc.person_identification,
        rc.person_name,
        rc.total_quantity,
        m.month_index,
        COALESCE(SUM(k.quantity), 0)::bigint AS monthly_quantity
      FROM ranked_customers rc
      CROSS JOIN months m
      LEFT JOIN kardex_products_sold k
        ON k.person_id = rc.person_id
        AND k.item_id  = $1
        AND DATE_TRUNC('month', k.invoice_date)::date = m.month_start
        AND k.deleted_at IS NULL
      GROUP BY rc.person_id, rc.person_identification, rc.person_name, rc.total_quantity, m.month_index
      ORDER BY rc.total_quantity DESC, m.month_index ASC
      `,
      [item_id, limit, offset]
    );

    // ── Agrupar filas por cliente y construir datasets ──────────────────────
    const customerMap = new Map<
      string,
      {
        person_id:             string;
        person_identification: string;
        person_name:           string;
        total_quantity:        number;
        monthlyData:           number[];
      }
    >();

    for (const row of rows) {
      if (!customerMap.has(row.person_id)) {
        customerMap.set(row.person_id, {
          person_id:             row.person_id,
          person_identification: row.person_identification,
          person_name:           row.person_name,
          total_quantity:        Number(row.total_quantity),
          monthlyData:           new Array(12).fill(0),
        });
      }
      const customer = customerMap.get(row.person_id)!;
      customer.monthlyData[Number(row.month_index)] = Number(row.monthly_quantity);
    }

    const data = Array.from(customerMap.values()).map((customer, index) => {
      const color = CHART_COLORS[index % CHART_COLORS.length];
      return {
        label:                 customer.person_name,
        backgroundColor:       color,
        borderColor:           color,
        borderWidth:           1,
        borderRadius:          4,
        data:                  customer.monthlyData,
        person_id:             customer.person_id,
        person_identification: customer.person_identification,
        total_quantity:        customer.total_quantity,
      };
    });

    const page_total = Math.ceil(cantidad_total_clientes / limit);

    return c.json(
      {
        success: true,
        data,
        data_items:              cantidad_total_clientes,
        page_current:            page,
        page_total,
        have_next_page:          page < page_total,
        have_previous_page:      page > 1,
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
