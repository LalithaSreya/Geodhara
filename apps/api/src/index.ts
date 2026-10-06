import { createApp } from './app.js';
import { env } from './config/env.js';
import { initRedis } from './config/redis.js';

async function startServer() {
  await initRedis();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`=======================================================`);
    console.log(`  GeoDhara API Server listening on port ${env.PORT}`);
    console.log(`  Tagline: "One parcel. One identity."`);
    console.log(`  Swagger OpenAPI Docs: http://localhost:${env.PORT}/docs`);
    console.log(`  Health Check: http://localhost:${env.PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
