import { Context } from 'hono/dist/types/context';
import { CreateKardexProductsSoldSchema } from '../../schemas/products.schemas';
import { KardexProductsSoldService } from '../../services/kardex_products_sold.service';
import { getDb } from '../../config/db';
import { SuccessResponse } from '../../schemas/response.schemas';

export const createKardexProductsSold = async (c: Context) => {
  const ref = c.req.query('ref')?.trim();
  if (ref && process.env.NODE_ENV === 'production' && process.env.ENABLE_DB_REF !== 'true') {
    return c.json({ success: false, error: 'Not Found' }, 404);
  }
  const db = getDb(ref);

  const body = await c.req.json();
  const parsed = CreateKardexProductsSoldSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Bad Request', message: parsed.error.message },
      400
    );
  }

  const product = await KardexProductsSoldService.create(db, parsed.data);

  const response = {
    success: true,
    data: product,
  };

  return c.json(response, 201);
};