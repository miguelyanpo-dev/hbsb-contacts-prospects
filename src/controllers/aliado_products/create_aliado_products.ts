import { Context } from 'hono/dist/types/context';
import { CreateAliadoProductsSchema } from '../../schemas/products.schemas';
import { AliadoProductsService } from '../../services/aliado_products.service';
import { getDb } from '../../config/db';
import { SuccessResponse } from '../../schemas/response.schemas';

export const createAliadoProduct = async (c: Context) => {
  const ref = c.req.query('ref')?.trim();
  if (ref && process.env.NODE_ENV === 'production' && process.env.ENABLE_DB_REF !== 'true') {
    return c.json({ success: false, error: 'Not Found' }, 404);
  }
  const db = getDb(ref);

  const body = await c.req.json();
  const parsed = CreateAliadoProductsSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Bad Request', message: parsed.error.message },
      400
    );
  }

  const product = await AliadoProductsService.create(db, parsed.data);

  const response = {
    success: true,
    data: product,
  };

  return c.json(response, 201);
};