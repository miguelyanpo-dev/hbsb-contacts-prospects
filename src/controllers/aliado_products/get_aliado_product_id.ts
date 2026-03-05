import { Context } from 'hono/dist/types/context';
import { z } from 'zod';
import { AliadoProductsService } from '../../services/aliado_products.service';
import { getDb } from '../../config/db';
import { SuccessResponse } from '../../schemas/response.schemas';

const IdParamSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

export const getAliadoProductById = async (c: Context) => {
  const ref = c.req.query('ref')?.trim();
  if (ref && process.env.NODE_ENV === 'production' && process.env.ENABLE_DB_REF !== 'true') {
    return c.json({ success: false, error: 'Not Found' }, 404);
  }
  const db = getDb(ref);

  const { id } = c.req.param();
  const parsed = IdParamSchema.safeParse({ id });

  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Bad Request', message: parsed.error.message },
      400
    );
  }

  const product = await AliadoProductsService.getById(db, Number(id));

  if (!product) {
    return c.json(
      { success: false, error: 'Not Found', message: 'Product not found' },
      404
    );
  }

  const response = {
    success: true,
    data: product,
  };

  return c.json(response, 200);
};