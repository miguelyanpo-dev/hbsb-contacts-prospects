import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';

// Aliado Products Controllers
import { getAliadoProducts } from '../controllers/aliado_products/get_aliado_products';
import { getAliadoProductById } from '../controllers/aliado_products/get_aliado_product_id';
import { createAliadoProduct } from '../controllers/aliado_products/create_aliado_products';
import { updateAliadoProduct } from '../controllers/aliado_products/update_aliado_product';
import { deleteAliadoProduct } from '../controllers/aliado_products/delete_aliado_product';
import { getAllAliadoProducts } from '../controllers/aliado_products/get_all_aliado_products';

// Kardex Products Buyed Controllers
import { getKardexProductsBuyed } from '../controllers/kardex_products_buyed/get_kardex_products_buyed';
import { getKardexProductsBuyedById } from '../controllers/kardex_products_buyed/get_kardex_products_buyed_id';
import { createKardexProductsBuyed } from '../controllers/kardex_products_buyed/create_kardex_products_buyed';
import { updateKardexProductsBuyed } from '../controllers/kardex_products_buyed/update_kardex_products_buyed';
import { deleteKardexProductsBuyed } from '../controllers/kardex_products_buyed/delete_kardex_products_buyed';

// Kardex Products Sold Controllers
import { getKardexProductsSold } from '../controllers/kardex_products_sold/get_kardex_products_sold';
import { getKardexProductsSoldById } from '../controllers/kardex_products_sold/get_kardex_products_sold_id';
import { createKardexProductsSold } from '../controllers/kardex_products_sold/create_kardex_products_sold';
import { updateKardexProductsSold } from '../controllers/kardex_products_sold/update_kardex_products_sold';
import { deleteKardexProductsSold } from '../controllers/kardex_products_sold/delete_kardex_products_sold';
import {
  PaginatedProductsResponseSchema,
  CreateAliadoProductsSchema,
  UpdateAliadoProductsSchema,
  GetAliadoProductsQuerySchema,
  CreateKardexProductsBuyedSchema,
  UpdateKardexProductsBuyedSchema,
  GetKardexProductsBuyedQuerySchema,
  CreateKardexProductsSoldSchema,
  UpdateKardexProductsSoldSchema,
  GetKardexProductsSoldQuerySchema,
} from '../schemas/products.schemas';
import { ErrorResponse, SuccessResponse } from '../schemas/response.schemas';

const router = new OpenAPIHono();

const IdParamSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const RefQuerySchema = z.object({
  ref: z.string().optional(),
});

// Routes GET

// aliado_products GET
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

// aliado_products GET all
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

// kardex_products_buyed GET
router.openapi(
  createRoute({
    method: 'get',
    path: '/kardex_products_buyed',
    request: {
      query: GetKardexProductsBuyedQuerySchema,
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: PaginatedProductsResponseSchema,
          },
        },
        description: 'List kardex products buyed with pagination',
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
  getKardexProductsBuyed as any
);

// Routes GET by id

// aliado_products GET by id
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

// kardex_products_buyed GET by id
router.openapi(
  createRoute({
    method: 'get',
    path: '/kardex_products_buyed/{id}',
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
        description: 'Get kardex product buyed by id',
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
  getKardexProductsBuyedById as any
);

// Routes POST

// aliado_products POST 
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

// kardex_products_buyed POST 
router.openapi(
  createRoute({
    method: 'post',
    path: '/kardex_products_buyed',
    request: {
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: CreateKardexProductsBuyedSchema,
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
  createKardexProductsBuyed as any
);


// Routes PATCH and PUT

// aliado_products PATCH 
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

// kardex_products_buyed PATCH 
router.openapi(
  createRoute({
    method: 'patch',
    path: '/kardex_products_buyed/{id}',
    request: {
      params: IdParamSchema,
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateKardexProductsBuyedSchema,
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
  updateKardexProductsBuyed as any
);

// aliado_products PUT
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

// kardex_products_buyed PUT
router.openapi(
  createRoute({
    method: 'put',
    path: '/kardex_products_buyed/{id}',
    request: {
      params: IdParamSchema,
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateKardexProductsBuyedSchema,
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
  updateKardexProductsBuyed as any
);

// Routes DELETE

// aliado_products DELETE
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

// kardex_products_buyed DELETE
router.openapi(
  createRoute({
    method: 'delete',
    path: '/kardex_products_buyed/{id}',
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
  deleteKardexProductsBuyed as any
);

// Routes GET

// kardex_products_sold GET
router.openapi(
  createRoute({
    method: 'get',
    path: '/kardex_products_sold',
    request: {
      query: GetKardexProductsSoldQuerySchema,
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: PaginatedProductsResponseSchema,
          },
        },
        description: 'List kardex products sold with pagination',
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
  getKardexProductsSold as any
);

// Routes GET by id

// kardex_products_sold GET by id
router.openapi(
  createRoute({
    method: 'get',
    path: '/kardex_products_sold/{id}',
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
        description: 'Get kardex product sold by id',
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
  getKardexProductsSoldById as any
);

// Routes POST

// kardex_products_sold POST 
router.openapi(
  createRoute({
    method: 'post',
    path: '/kardex_products_sold',
    request: {
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: CreateKardexProductsSoldSchema,
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
  createKardexProductsSold as any
);

// Routes PATCH and PUT

// kardex_products_sold PATCH 
router.openapi(
  createRoute({
    method: 'patch',
    path: '/kardex_products_sold/{id}',
    request: {
      params: IdParamSchema,
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateKardexProductsSoldSchema,
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
  updateKardexProductsSold as any
);

// kardex_products_sold PUT
router.openapi(
  createRoute({
    method: 'put',
    path: '/kardex_products_sold/{id}',
    request: {
      params: IdParamSchema,
      query: RefQuerySchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateKardexProductsSoldSchema,
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
  updateKardexProductsSold as any
);

// Routes DELETE

// kardex_products_sold DELETE
router.openapi(
  createRoute({
    method: 'delete',
    path: '/kardex_products_sold/{id}',
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
  deleteKardexProductsSold as any
);

export default router;


