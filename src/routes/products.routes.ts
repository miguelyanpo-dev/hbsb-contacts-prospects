import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { getKardex } from '../controllers/products/get_products';
import { createKardex } from '../controllers/products/create_products';
import { getKardexById } from '../controllers/products/get_product_id';
import { updateKardex } from '../controllers/products/update_product';
import { deleteKardex } from '../controllers/products/delete_products';
import { getProductsNames } from '../controllers/products/get_products_names';
import { getProductsQuantityByMonth } from '../controllers/products/get_products_quantity_by_month';
import { getTopCustomersByProduct } from '../controllers/products/get_top_customers_by_product';
import {
  CreateProductsSchema,
  GetProductsQuerySchema,
  GetProductsNamesQuerySchema,
  GetProductsQuantityByMonthQuerySchema,
  GetTopCustomersByProductQuerySchema,
  PaginatedProductsResponseSchema,
  UpdateProductsSchema,

} from '../schemas/products.schemas';
import { ErrorResponse, SuccessResponse } from '../schemas/response.schemas';

const router = new OpenAPIHono();

const IdParamSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const RefQuerySchema = z.object({
  ref: z.string().optional(),
});

router.openapi(
  createRoute({
    method: 'get',
    path: '/',
    request: {
      query: GetProductsQuerySchema,
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: PaginatedProductsResponseSchema,
          },
        },
        description: 'List kardex with pagination',
      },
      400: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Bad Request',
      },
      500: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Internal Server Error',
      },
    },
  }),
  getKardex as any
);

router.openapi(
  createRoute({
    method: 'get',
    path: '/products_names',
    request: {
      query: GetProductsNamesQuerySchema,
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: z.array(z.object({
                code: z.string(),
                combine_names: z.string()
              }))
            }),
          },
        },
        description: 'Get products names with code and combine_names',
      },
      400: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Bad Request',
      },
      500: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Internal Server Error',
      },
    },
  }),
  getProductsNames as any
);

router.openapi(
  createRoute({
    method: 'get',
    path: '/quantity_by_month',
    request: {
      query: GetProductsQuantityByMonthQuerySchema,
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: z.array(z.object({
                month: z.string(),
                quantity: z.number()
              }))
            }),
          },
        },
        description: 'Get products quantity by month for last 12 months',
      },
      400: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Bad Request',
      },
      500: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Internal Server Error',
      },
    },
  }),
  getProductsQuantityByMonth as any
);
router.openapi(
  createRoute({
    method: 'get',
    path: '/top_customers',
    request: {
      query: GetTopCustomersByProductQuerySchema,
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: z.array(z.record(z.string(), z.object({
                "cantidad total": z.string(),
                "Mar 2026": z.string().optional(),
                "Feb 2026": z.string().optional(),
                "Ene 2026": z.string().optional(),
                "Dic 2025": z.string().optional(),
                "Nov 2025": z.string().optional(),
                "Oct 2025": z.string().optional(),
                "Sep 2025": z.string().optional(),
                "Ago 2025": z.string().optional(),
                "Jul 2025": z.string().optional(),
                "Jun 2025": z.string().optional(),
                "May 2025": z.string().optional(),
                "Abr 2025": z.string().optional()
              }))),
              data_items: z.number(),
              page_current: z.number(),
              page_total: z.number(),
              have_next_page: z.boolean(),
              have_previus_page: z.boolean()
            }),
          },
        },
        description: 'Get top customers by product with monthly distribution',
      },
      400: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Bad Request',
      },
      500: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Internal Server Error',
      },
    },
  }),
  getTopCustomersByProduct as any
);

router.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    request: {
      params: IdParamSchema,
      query: RefQuerySchema,
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: SuccessResponse,
          },
        },
        description: 'Get kardex by id',
      },
      400: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Bad Request',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Not Found',
      },
      500: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Internal Server Error',
      },
    },
  }),
  getKardexById as any
);

router.openapi(
  createRoute({
    method: 'post',
    path: '/',
    request: {
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: CreateProductsSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          'application/json': {
            schema: SuccessResponse,
          },
        },
        description: 'Created',
      },
      400: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Bad Request',
      },
      500: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Internal Server Error',
      },
    },
  }),
  createKardex as any
);


router.openapi(
  createRoute({
    method: 'patch',
    path: '/{id}',
    request: {
      params: IdParamSchema,
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateProductsSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: SuccessResponse,
          },
        },
        description: 'Updated',
      },
      400: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Bad Request',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Not Found',
      },
      500: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Internal Server Error',
      },
    },
  }),
  updateKardex as any
);

router.openapi(
  createRoute({
    method: 'put',
    path: '/{id}',
    request: {
      params: IdParamSchema,
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateProductsSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: SuccessResponse,
          },
        },
        description: 'Updated',
      },
      400: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Bad Request',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Not Found',
      },
      500: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Internal Server Error',
      },
    },
  }),
  updateKardex as any
);

router.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    request: {
      params: IdParamSchema,
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: z.object({
              updated_by_user_name: z.string().optional(),
              updated_by_user_id: z.string().optional(),
            }),
          },
        },
        required: false,
      },
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: SuccessResponse,
          },
        },
        description: 'Deactivated',
      },
      400: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Bad Request',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Not Found',
      },
      500: {
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
        description: 'Internal Server Error',
      },
    },
  }),
  deleteKardex as any
);

export default router;
