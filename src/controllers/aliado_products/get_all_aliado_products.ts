import { Context } from 'hono/dist/types/context';
import { AliadoProductsService } from '../../services/aliado_products.service';
import { getDb } from '../../config/db';
import { SuccessResponse } from '../../schemas/response.schemas';

export const getAllAliadoProducts = async (c: Context) => {
  const ref = c.req.query('ref')?.trim();
  if (ref && process.env.NODE_ENV === 'production' && process.env.ENABLE_DB_REF !== 'true') {
    return c.json({ success: false, error: 'Not Found' }, 404);
  }
  const db = getDb(ref);

  const products = await AliadoProductsService.getAll(db);

  const response = {
    success: true,
    data: products,
  };

  return c.json(response, 200);
};