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
    throw Error(`cannot require() module with extension '${extension}'`);
  }
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
      try {
        return require.resolve(filePath + '.js');
      } catch (err) {
        try {
          return require.resolve(filePath + '.json');
        } catch (err) {
          handleExtensionErr(extension);
          throw err;
        }
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
      if (resolveFile(pathWithoutExtension + '.js')) {
        return import(pathWithoutExtension + '.js');
      }
      return null;
    }
    case 'json': {
      if (resolveFile(pathWithoutExtension + '.json')) {
        return import(pathWithoutExtension + '.json');
      }
      return null;
    }
    default: {
      try {
        if (resolveFile(filePath + `.js`)) {
          return import(filePath + '.js');
        }
      } catch (err) {
        handleExtensionErr(extension);
      }
      if (resolveFile(filePath + `.json`)) {
        return import(filePath + '.json');
      }
      handleExtensionErr(extension);
    }
  }
}
