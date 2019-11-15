import fs from 'fs';

export function getFileExtension(filePath: string): string | null {
  const pathParts = /^.+\.([^.]+)$/.exec(filePath);
  // if there's a file extension
  if (pathParts && pathParts.length > 1) {
    return pathParts[1];
  }
  return null;
}

export function getPathWithoutExtension(
  filePath: string,
  extension: string | null,
) {
  let pathWithoutExtension = filePath;
  if (extension) {
    pathWithoutExtension = filePath.substr(
      0,
      filePath.length - (extension.length + 1),
    );
  }
  return pathWithoutExtension;
}

// these make webpack happy

export function resolveFile(filePath: string) {
  const extension = getFileExtension(filePath);
  const pathWithoutExtension = getPathWithoutExtension(filePath, extension);
  switch (extension) {
    case 'js': {
      return require.resolve(pathWithoutExtension + '.js');
    }
    case 'json': {
      return require.resolve(pathWithoutExtension + '.json');
    }
    default: {
      if (fs.existsSync(filePath + `.js`)) {
        return require.resolve(filePath + '.js');
      }
      if (fs.existsSync(filePath + `.json`)) {
        return require.resolve(filePath + '.json');
      }
      if (extension) {
        throw Error(
          `cannot require.resolve() module with extension '${extension}'`,
        );
      }
    }
  }
}

// again, explicit with the extensions
// dynamic imports, aka import(packageName).then()
// is available in node 9.7+, and most modern browsers

export function requireFile(filePath: string) {
  const extension = getFileExtension(filePath);
  const pathWithoutExtension = getPathWithoutExtension(filePath, extension);
  switch (extension) {
    case 'js': {
      return import(pathWithoutExtension + '.js');
    }
    case 'json': {
      return import(pathWithoutExtension + '.json');
    }
    default: {
      if (fs.existsSync(filePath + `.js`)) {
        return import(filePath + '.js');
      }
      if (fs.existsSync(filePath + `.json`)) {
        return import(filePath + '.json');
      }
      if (extension) {
        throw Error(`cannot require() module with extension '${extension}'`);
      }
      throw Error(`No extension found, and no supported file found to match '${filePath}'`);
    }
  }
}
