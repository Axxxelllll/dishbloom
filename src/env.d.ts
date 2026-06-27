/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<{
  DB: import('@cloudflare/workers-types').D1Database;
  BUCKET: import('@cloudflare/workers-types').R2Bucket;
}>;

declare namespace App {
  interface Locals extends Runtime {}
}
