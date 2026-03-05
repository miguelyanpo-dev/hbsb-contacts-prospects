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
import { createKardexBuy } from '../controllers/products/create_products_buy';

// Aliado Products Controllers
import { getAliadoProducts } from '../controllers/aliado_products/get_aliado_products';
import { getAliadoProductById } from '../controllers/aliado_products/get_aliado_product_id';
import { createAliadoProduct } from '../controllers/aliado_products/create_aliado_products';
import { updateAliadoProduct } from '../controllers/aliado_products/update_aliado_product';
import { deleteAliadoProduct } from '../controllers/aliado_products/delete_aliado_product';
import { getAllAliadoProducts } from '../controllers/aliado_products/get_all_aliado_products';
import {
  CreateProductsSchema,
  GetProductsQuerySchema,
  GetProductsNamesQuerySchema,
  GetProductsQuantityByMonthQuerySchema,
  GetTopCustomersByProductQuerySchema,
  PaginatedProductsResponseSchema,
  UpdateProductsSchema,
  CreateAliadoProductsSchema,
  UpdateAliadoProductsSchema,
  GetAliadoProductsQuerySchema,
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
              data: z.array(z.object({
                client_name: z.string(),
                cantidad_total: z.string(),
                meses: z.record(z.string(), z.string())
              })),
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
    method: 'post',
    path: '/products_buy',
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
  createKardexBuy as any
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

// Aliado Products Routes

router.openapi(
  createRoute({
    method: 'get',
    path: '/aliado_products',
    request: {
      query: GetAliadoProductsQuerySchema,
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: PaginatedProductsResponseSchema,
          },
        },
        description: 'List aliado products with pagination',
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
  getAliadoProducts as any
);

router.openapi(
  createRoute({
    method: 'get',
    path: '/aliado_products/{id}',
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
        description: 'Get aliado product by id',
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
  getAliadoProductById as any
);

router.openapi(
  createRoute({
    method: 'post',
    path: '/aliado_products',
    request: {
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: CreateAliadoProductsSchema,
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
  createAliadoProduct as any
);

router.openapi(
  createRoute({
    method: 'patch',
    path: '/aliado_products/{id}',
    request: {
      params: IdParamSchema,
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateAliadoProductsSchema,
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
  updateAliadoProduct as any
);

router.openapi(
  createRoute({
    method: 'put',
    path: '/aliado_products/{id}',
    request: {
      params: IdParamSchema,
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateAliadoProductsSchema,
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
  updateAliadoProduct as any
);

router.openapi(
  createRoute({
    method: 'delete',
    path: '/aliado_products/{id}',
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
  deleteAliadoProduct as any
);

// Ruta para obtener todos los productos aliados sin límites
router.openapi(
  createRoute({
    method: 'get',
    path: '/aliado_products/all',
    request: {
      query: RefQuerySchema,
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: SuccessResponse,
          },
        },
        description: 'Get all aliado products without pagination',
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
  getAllAliadoProducts as any
);

export default router;
