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

function handleExtensionErr(extension: string | null) {
  if (extension) {
    throw Error(`cannot import() module with extension '${extension}'`);
  }
}

// these make webpack happy

const resolveJs = (path: string) => require.resolve(path + '.js');
const resolveJSON = (path: string) => require.resolve(path + '.json');

const importJs = (path: string) => import(path + '.js');
const importJSON = (path: string) => import(path + '.json');

export function resolveFile(filePath: string) {
  const extension = getFileExtension(filePath);
  const pathWithoutExtension = getPathWithoutExtension(filePath, extension);
  switch (extension) {
    case 'js': {
      return resolveJs(pathWithoutExtension);
    }
    case 'json': {
      return resolveJSON(pathWithoutExtension);
    }
    default: {
      try {
        return resolveJs(filePath);
      } catch (_error) {
        return resolveJSON(filePath);
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
      if (resolveFile(pathWithoutExtension + `.js`)) {
        return importJs(pathWithoutExtension);
      }
      return null;
    }
    case 'json': {
      if (resolveFile(pathWithoutExtension + `.json`)) {
        return importJSON(pathWithoutExtension);
      }
      return null;
    }
    default: {
      try {
        if (resolveFile(filePath + `.js`)) {
          return importJs(filePath);
        }
      } catch (err) {
        handleExtensionErr(extension);
      }
      if (resolveFile(filePath + `.json`)) {
        return importJSON(filePath);
      }
      handleExtensionErr(extension);
    }
  }
}
