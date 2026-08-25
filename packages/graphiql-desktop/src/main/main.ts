import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { app, BrowserWindow, ipcMain, protocol, shell } from 'electron';
import {
  executeGraphQLRequest,
  isValidGraphQLRequestPayload,
} from './execute-graphql-request';

const APP_SCHEME = 'graphiql-desktop';
const APP_HOST = 'bundle';
const RENDERER_DIR = resolve(__dirname, '..', 'renderer');

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

// A real (non-file://) origin is required for `localStorage` persistence and
// for monaco's module workers, both of which behave inconsistently or not at
// all when loaded from `file://`. `protocol.handle` on a privileged custom
// scheme gives us an origin without needing an HTTP server.
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

function isInAppScheme(url: string): boolean {
  try {
    return new URL(url).protocol === `${APP_SCHEME}:`;
  } catch {
    return false;
  }
}

async function handleAppRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname =
    url.pathname === '/' || url.pathname === '' ? '/index.html' : url.pathname;

  const decodedPathname = decodeURIComponent(pathname);
  // `\` isn't a separator in a POSIX join/resolve, so a backslash can slip
  // through to a Windows filesystem call untouched — reject it outright
  // rather than trying to normalize it away.
  if (decodedPathname.includes('\\')) {
    return new Response('Not found', { status: 404 });
  }

  const filePath = resolve(join(RENDERER_DIR, decodedPathname));
  // Path-traversal guard: the resolved file must stay inside RENDERER_DIR.
  if (filePath !== RENDERER_DIR && !filePath.startsWith(RENDERER_DIR + '/')) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    const contentType =
      MIME_TYPES[extname(filePath)] ?? 'application/octet-stream';
    return new Response(data, {
      status: 200,
      headers: { 'content-type': contentType },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'GraphiQL',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(__dirname, '..', 'preload', 'preload.js'),
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (!isInAppScheme(url)) {
      event.preventDefault();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        void shell.openExternal(url);
      }
    }
  });

  void window.loadURL(`${APP_SCHEME}://${APP_HOST}/index.html`);
}

app.whenReady().then(() => {
  protocol.handle(APP_SCHEME, handleAppRequest);

  ipcMain.handle('graphiql:fetch', async (_event, payload: unknown) => {
    if (!isValidGraphQLRequestPayload(payload)) {
      return { ok: false, errorMessage: 'Invalid GraphQL request payload' };
    }
    return executeGraphQLRequest(payload);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
