import nodePath from 'node:path';

/**
 * Subset of `node:path` used here, so tests can inject `path.posix` /
 * `path.win32` and assert the containment logic actually holds on both —
 * rather than only being exercised on whatever platform happens to run the
 * test suite. That's how a POSIX-only `/`-suffix containment check once
 * slipped through: it silently 404'd every asset on Windows, where
 * `path.resolve` yields backslash-separated paths.
 */
export type PathModule = Pick<
  typeof nodePath,
  'join' | 'resolve' | 'relative' | 'extname' | 'isAbsolute' | 'sep'
>;

export interface ResolvedRendererFile {
  filePath: string;
  contentType: string;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

/**
 * Resolves a `graphiql-desktop://` request path to a file inside
 * `rendererDir`, or `null` if the path is malformed or would escape it.
 *
 * No Electron imports, so this can be unit tested hermetically with no
 * Electron runtime required — it's the untrusted-input-facing part of the
 * scheme handler (a compromised/buggy renderer could request anything).
 */
export function resolveRendererPath(
  requestPathname: string,
  rendererDir: string,
  pathModule: PathModule = nodePath,
): ResolvedRendererFile | null {
  const pathname =
    requestPathname === '' || requestPathname === '/'
      ? '/index.html'
      : requestPathname;

  let decodedPathname: string;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  // `\` isn't a separator to a POSIX join/resolve, so a backslash could
  // otherwise slip through the containment check below untouched.
  if (decodedPathname.includes('\\')) {
    return null;
  }

  const filePath = pathModule.resolve(
    pathModule.join(rendererDir, decodedPathname),
  );

  // Containment via `path.relative` rather than a string-prefix check on
  // `rendererDir`, so it works regardless of which platform's separator the
  // injected `pathModule` uses.
  const rel = pathModule.relative(rendererDir, filePath);
  const isContained =
    rel !== '..' &&
    !rel.startsWith(`..${pathModule.sep}`) &&
    !pathModule.isAbsolute(rel);
  if (!isContained) {
    return null;
  }

  return {
    filePath,
    contentType:
      MIME_TYPES[pathModule.extname(filePath)] ?? 'application/octet-stream',
  };
}
