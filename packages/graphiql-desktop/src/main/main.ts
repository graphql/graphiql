import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { app, BrowserWindow, ipcMain, protocol, shell } from 'electron';
import {
  executeGraphQLRequest,
  isValidGraphQLRequestPayload,
} from './execute-graphql-request';
import { resolveRendererPath } from './resolve-renderer-path';

const APP_SCHEME = 'graphiql-desktop';
const APP_HOST = 'bundle';
const RENDERER_DIR = resolve(__dirname, '..', 'renderer');

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
  const resolved = resolveRendererPath(url.pathname, RENDERER_DIR);
  if (!resolved) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const data = await readFile(resolved.filePath);
    return new Response(data, {
      status: 200,
      headers: { 'content-type': resolved.contentType },
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
