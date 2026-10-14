/** Edges that are cross-cutting / background / aggregating rather than a
 * direct "this calls that as part of handling the request" relationship —
 * rendered dashed, same convention used throughout this project's other
 * architecture docs (solid = direct depends-on, dashed = looser/indirect). */
export const DASHED_EDGES = new Set<string>([
  'frontend-chat->request-log', // every request is logged by middleware, not something the UI calls directly
  'request-log->stats', // stats reads the log; a cross-module aggregation, not a per-request call
  'indexing-service->graph-load', // a periodic background refresh, not part of answering any one question
  'indexing-service->vector-store',
  'auth-service->conversations-db', // only touched once, at login, to claim prior history
]);
