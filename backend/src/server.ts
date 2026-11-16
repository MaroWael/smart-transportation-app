// ---------------------------------------------------------------
// Smart Transportation — Local development server
// ---------------------------------------------------------------
// Entry point for local development only. Imports the Express app
// from ./app and starts listening on PORT.
//
// The listen call is guarded by `require.main === module` so it only
// runs when this file is executed directly (e.g. `tsx src/server.ts`
// or `node dist/src/server.js`), never when imported as a module by
// a serverless runtime.
// ---------------------------------------------------------------

import 'dotenv/config';
import { app } from './app';
import { env } from './config/env';

const PORT = Number(env.PORT);

const start = (): void => {
  app.listen(PORT, () => {
    console.log(
      `🚀  Server running in ${env.NODE_ENV} mode on http://localhost:${PORT}`
    );
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });
};

// Only listen when run directly, not when imported (serverless/Vercel)
if (require.main === module) {
  start();
}

export { app, start };
