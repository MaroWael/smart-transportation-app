// ---------------------------------------------------------------
// Smart Transportation — Vercel serverless entry point
// ---------------------------------------------------------------
// Imports the Express app and exports it as the default export.
// Vercel's @vercel/node builder invokes this default export as the
// function handler for every request.
//
// NOTE: app.listen() is intentionally NOT called here.
// ---------------------------------------------------------------

import { app } from '../src/app';

export default app;
