import { Context } from 'hono/dist/types/context';
import { GetKardexProductsSoldQuerySchema } from '../../schemas/products.schemas';
import { KardexProductsSoldService } from '../../services/kardex_products_sold.service';
import { getDb } from '../../config/db';
import { PaginatedProductsResponseSchema } from '../../schemas/products.schemas';

export const getKardexProductsSold = async (c: Context) => {
  const ref = c.req.query('ref')?.trim();
  if (ref && process.env.NODE_ENV === 'production' && process.env.ENABLE_DB_REF !== 'true') {
    return c.json({ success: false, error: 'Not Found' }, 404);
  }
  const db = getDb(ref);

  const query = c.req.query();
  
  const parsed = GetKardexProductsSoldQuerySchema.safeParse(query);

  if (!parsed.success) {
    return c.json(
      { success: false, error: 'Bad Request', message: parsed.error.message },
      400
    );
  }

  const page = Number(parsed.data.page ?? 1);
  const limit = Number(parsed.data.limit ?? 1000);

  const filters = {
    page,
    limit,
    invoice_id: parsed.data.invoice_id,
    person_id: parsed.data.person_id,
    item_id: parsed.data.item_id,
    date_start: parsed.data.date_start,
    date_end: parsed.data.date_end,
  };

  const { rows, total } = await KardexProductsSoldService.getPaginated(db, filters);

  const totalPages = Math.ceil(total / limit);
  const haveNextPage = page < totalPages;
  const havePreviousPage = page > 1;

  const response = {
    success: true,
    data: rows,
    data_items: total,
    page_current: page,
    page_total: totalPages,
    have_next_page: haveNextPage,
    have_previus_page: havePreviousPage,
  };

  return c.json(response, 200);
};