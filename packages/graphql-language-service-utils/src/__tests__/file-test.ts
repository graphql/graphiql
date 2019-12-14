import path from 'path';

import {
  getFileExtension,
  getPathWithoutExtension,
  resolveFile,
  requireFile,
} from '../file';

describe('getFileExtension', () => {
  it('should resolve an extension', () => {
    const extension = getFileExtension('example/example.txt');
    expect(extension).toEqual('txt');
  });
  it('should resolve null when no extension is present', () => {
    const extension = getFileExtension('example/example');
    expect(extension).toEqual(null);
  });

  it('should return an extension with multiple dots in the path', () => {
    const extension = getFileExtension(
      'example.example/example/something.esm.js',
    );
    expect(extension).toEqual('js');
  });
});

describe('getPathWithoutExtension', () => {
  it('should resolve when path has extension', () => {
    const extension = getPathWithoutExtension('example/example.txt', 'txt');
    expect(extension).toEqual('example/example');
  });
  it('should resolve when path has no extension', () => {
    const extension = getPathWithoutExtension(
      'example/example.example/example',
      null,
    );
    expect(extension).toEqual('example/example.example/example');
  });
});

describe('requireFile', () => {
  it('should require file with extension using json', async () => {
    const file = await requireFile(
      path.join(__dirname, '__fixtures__', 'package.json'),
    );
    expect(file.name).toEqual('example');
  });
  it('should require file with extension using js', async () => {
    const file = await requireFile(
      path.join(__dirname, '__fixtures__', 'file.js'),
    );
    expect(file.example).toEqual(true);
  });
  it('should fail when requiring an invalid extension', () => {
    expect(() => requireFile('./__fixtures__/invalid.fake')).toThrowError(
      `cannot import() module with extension 'fake'`,
    );
  });
  it('should fail when requiring a valid extension (js) but invalid file path', () => {
    expect(() => requireFile('./__fixtures__/invalid.js')).toThrowError(
      `Cannot find module './__fixtures__/invalid.js' from 'file.ts'`,
    );
  });
  it('should fail when requiring a valid extension (json) but invalid file path', () => {
    expect(() => requireFile('./__fixtures__/npmignore.json')).toThrowError(
      `Cannot find module './__fixtures__/npmignore.json' from 'file.ts'`,
    );
  });
  it('should require file with no extension using js', async () => {
    const config = await requireFile(
      path.join(__dirname, '__fixtures__', 'file'),
    );
    await expect(config.example).toEqual(true);
  });
  it('should require file with no extension using json', async () => {
    const file = await requireFile(
      path.join(__dirname, '__fixtures__', 'package'),
    );
    expect(file.name).toEqual('example');
  });
  it('should fail when requiring a file with no extension', async () => {
    expect(() =>
      requireFile(path.join(__dirname, '__fixtures__', 'packages')),
    ).toThrowError(
      `Cannot find module '${__dirname}/__fixtures__/packages.json' from 'file.ts'`,
    );
  });
});

describe('resolveFile', () => {
  it('should resolve when path has extension', () => {
    const resolvedPath = resolveFile(
      path.join(__dirname, './__fixtures__/package.json'),
    );
    expect(resolvedPath).toEqual(
      require.resolve(path.join(__dirname, '__fixtures__/package.json')),
    );
  });

  it('should resolve when path has extension', () => {
    const resolvedPath = resolveFile(
      path.join(__dirname, '__fixtures__', 'package'),
    );
    expect(resolvedPath).toEqual(
      require.resolve(path.join(__dirname, '__fixtures__', 'package')),
    );
  });

  it('should resolve when path has extension', () => {
    const resolvedPath = resolveFile(
      path.join(__dirname, '__fixtures__', 'package'),
    );
    expect(resolvedPath).toEqual(
      require.resolve(path.join(__dirname, '__fixtures__', 'package')),
    );
  });

  it('should resolve when path has extension but path is not found', () => {
    expect(() => resolveFile('./__fixtures__/nonexistant.js')).toThrowError(
      `Cannot find module './__fixtures__/nonexistant.js' from 'file.ts'`,
    );
  });

  it('should resolve when path has no extension', () => {
    const resolvedPath = resolveFile(
      path.join(__dirname, '__fixtures__', 'file'),
    );
    expect(resolvedPath).toEqual(
      require.resolve(path.join(__dirname, '__fixtures__', 'file')),
    );
  });
});
