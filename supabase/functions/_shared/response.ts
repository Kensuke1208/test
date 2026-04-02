/**
 * Response helpers for Edge Functions
 *
 * CORS headers are handled by Hono's cors() middleware.
 * These helpers only set Content-Type.
 */

export function errorResponse(
  error: string,
  message: string,
  status: number,
): Response {
  return new Response(JSON.stringify({ error, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const errors = {
  badRequest: (message: string) =>
    errorResponse("bad_request", message, 400),
  unauthorized: (message = "Unauthorized") =>
    errorResponse("unauthorized", message, 401),
  notFound: (message: string) =>
    errorResponse("not_found", message, 404),
  internal: (message = "Internal server error") =>
    errorResponse("internal_error", message, 500),
  badGateway: (message: string) =>
    errorResponse("upstream_error", message, 502),
  gatewayTimeout: (message = "Upstream timeout") =>
    errorResponse("upstream_timeout", message, 504),
};
