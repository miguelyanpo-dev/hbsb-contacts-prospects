import { Context } from 'hono/dist/types/context';
import { getDb } from '../../config/db';

export const getProductsNames = async (c: Context) => {
  const ref = c.req.query('ref')?.trim();
  if (ref && process.env.NODE_ENV === 'production' && process.env.ENABLE_DB_REF !== 'true') {
    return c.json({ success: false, error: 'Not Found' }, 404);
  }
  const db = getDb(ref);

  const { rows } = await db.query(
    `
    SELECT 
      id,
      item_id,
      item_code,
      item_name,
      item_image,
      item_description,
      item_price_sell_taxes,
      item_stock,
      item_combinated_names
    FROM aliado_products
    WHERE deleted_at IS NULL
    ORDER BY item_name ASC
    `
  );

  return c.json({
    success: true,
    data: rows
  }, 200);
};