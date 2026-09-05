import { posix, win32 } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveRendererPath } from './resolve-renderer-path';
import type { PathModule } from './resolve-renderer-path';

describe('resolveRendererPath', () => {
  it('resolves a normal asset path', () => {
    const result = resolveRendererPath(
      '/assets/index.js',
      '/app/dist/renderer',
      posix,
    );
    expect(result).toEqual({
      filePath: '/app/dist/renderer/assets/index.js',
      contentType: 'text/javascript',
    });
  });

  it('picks a content type from the extension', () => {
    expect(
      resolveRendererPath('/index.html', '/app/dist/renderer', posix)
        ?.contentType,
    ).toBe('text/html');
    expect(
      resolveRendererPath('/assets/app.css', '/app/dist/renderer', posix)
        ?.contentType,
    ).toBe('text/css');
    expect(
      resolveRendererPath(
        '/assets/thing.unknownext',
        '/app/dist/renderer',
        posix,
      )?.contentType,
    ).toBe('application/octet-stream');
  });

  it('defaults "/" to index.html', () => {
    const result = resolveRendererPath('/', '/app/dist/renderer', posix);
    expect(result?.filePath).toBe('/app/dist/renderer/index.html');
  });

  it('defaults an empty path to index.html', () => {
    const result = resolveRendererPath('', '/app/dist/renderer', posix);
    expect(result?.filePath).toBe('/app/dist/renderer/index.html');
  });

  it('rejects plain ".." traversal', () => {
    expect(
      resolveRendererPath('/../secret.txt', '/app/dist/renderer', posix),
    ).toBeNull();
    expect(
      resolveRendererPath('/../../etc/passwd', '/app/dist/renderer', posix),
    ).toBeNull();
  });

  it('rejects percent-encoded slash traversal', () => {
    expect(
      resolveRendererPath(
        '/..%2f..%2fetc%2fpasswd',
        '/app/dist/renderer',
        posix,
      ),
    ).toBeNull();
  });

  it('rejects percent-encoded backslash traversal', () => {
    expect(
      resolveRendererPath('/..%5c..%5csecret', '/app/dist/renderer', posix),
    ).toBeNull();
    expect(
      resolveRendererPath('/%5c%5cserver%5cshare', '/app/dist/renderer', posix),
    ).toBeNull();
  });

  it('rejects a literal backslash without needing decoding', () => {
    expect(
      resolveRendererPath('/foo\\..\\bar', '/app/dist/renderer', posix),
    ).toBeNull();
  });

  describe.each<{ name: string; pathModule: PathModule; rendererDir: string }>([
    { name: 'posix', pathModule: posix, rendererDir: '/app/dist/renderer' },
    {
      name: 'win32',
      pathModule: win32,
      rendererDir: 'C:\\Users\\app\\resources\\renderer',
    },
  ])('containment on $name paths', ({ pathModule, rendererDir }) => {
    it('resolves a normal path inside the renderer dir', () => {
      const result = resolveRendererPath(
        '/index.html',
        rendererDir,
        pathModule,
      );
      expect(result).not.toBeNull();
      // This is the regression this suite guards against: a POSIX-hardcoded
      // `/`-suffix containment check never matches on win32 paths, so every
      // asset request would incorrectly 404.
      expect(result?.filePath.startsWith(rendererDir)).toBe(true);
    });

    it('rejects a path that escapes the renderer dir', () => {
      expect(
        resolveRendererPath('/../../secret.txt', rendererDir, pathModule),
      ).toBeNull();
    });
  });
});
