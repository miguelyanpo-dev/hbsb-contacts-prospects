export const config = {
  port: Number(process.env.PORT || 3001),
  env: process.env.NODE_ENV || 'development',
  productionUrl: process.env.PRODUCTION_URL || 'https://hbsb-limpio.vercel.app',
  cors: {
    // When CORS_ORIGIN is not set, use '*' (string) not ['*'] (array).
    // Hono's CORS middleware treats an array as an allowlist: ['*'] would only
    // match the literal origin "*", which no browser ever sends.
    origins: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : '*',
  },
};
