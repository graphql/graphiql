/**
 * Executes GraphQL requests on behalf of the renderer.
 *
 * Runs in the Electron main process (Node's `fetch` has no CORS enforcement),
 * which is the whole point of this app: it lets GraphiQL talk to any GraphQL
 * API, including ones that don't send permissive CORS headers.
 *
 * Deliberately free of Electron imports so it can be unit tested with plain
 * Node sockets, with no Electron runtime required.
 */

export interface GraphQLRequestPayload {
  url: string;
  headers?: Record<string, string>;
  body: string;
}

export interface GraphQLRequestResult {
  ok: boolean;
  status?: number;
  contentType?: string;
  text?: string;
  errorMessage?: string;
}

export interface ExecuteGraphQLRequestOptions {
  /** @default 60_000 */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;

const DEFAULT_HEADERS = {
  'content-type': 'application/json',
  accept: 'application/json',
};

/**
 * The renderer is untrusted input (a user could point it at anything), so
 * only allow the schemes a GraphQL HTTP endpoint could plausibly use. This
 * blocks `file:`, `ftp:`, and other schemes that could be used to read local
 * files or reach otherwise-unreachable services through the main process.
 */
function assertAllowedUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: "${rawUrl}"`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(
      `Refusing to fetch "${rawUrl}": only http/https URLs are allowed`,
    );
  }
  return url;
}

export async function executeGraphQLRequest(
  payload: GraphQLRequestPayload,
  options: ExecuteGraphQLRequestOptions = {},
): Promise<GraphQLRequestResult> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  let url: URL;
  try {
    url = assertAllowedUrl(payload.url);
  } catch (error) {
    return {
      ok: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  // Header names are case-insensitive over HTTP, but a plain object merge
  // isn't: a user-supplied `Content-Type` wouldn't override our lowercase
  // `content-type` default, and `fetch`'s `Headers` would then see both and
  // comma-join them into a single (wrong) value. Lowercase incoming keys
  // first so the merge actually overrides.
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  for (const [key, value] of Object.entries(payload.headers ?? {})) {
    headers[key.toLowerCase()] = value;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payload.body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type') ?? undefined,
      text,
    };
  } catch (error) {
    return {
      ok: false,
      errorMessage: describeFetchError(error, payload.url),
    };
  }
}

function describeFetchError(error: unknown, url: string): string {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError') {
      return `Request to "${url}" timed out`;
    }
    // fetch() wraps the underlying cause (e.g. ECONNREFUSED) here.
    const cause =
      error.cause instanceof Error ? `: ${error.cause.message}` : '';
    return `Request to "${url}" failed: ${error.message}${cause}`;
  }
  return `Request to "${url}" failed: ${String(error)}`;
}

/**
 * Validates payloads coming across the IPC boundary from the (untrusted)
 * renderer before they're passed to `executeGraphQLRequest`.
 */
export function isValidGraphQLRequestPayload(
  value: unknown,
): value is GraphQLRequestPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  // Reject prototype-pollution-style payloads outright.
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return false;
  }
  const payload = value as Record<string, unknown>;

  if (typeof payload.url !== 'string' || payload.url.length === 0) {
    return false;
  }
  if (typeof payload.body !== 'string') {
    return false;
  }
  if (payload.headers !== undefined) {
    if (
      typeof payload.headers !== 'object' ||
      payload.headers === null ||
      Array.isArray(payload.headers) ||
      Object.getPrototypeOf(payload.headers) !== Object.prototype
    ) {
      return false;
    }
    for (const [key, headerValue] of Object.entries(payload.headers)) {
      if (typeof key !== 'string' || typeof headerValue !== 'string') {
        return false;
      }
    }
  }

  const allowedKeys = new Set(['url', 'headers', 'body']);
  return Object.keys(payload).every(key => allowedKeys.has(key));
}
