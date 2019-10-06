function getExtension (pathParts: string[]): string | null {
  return pathParts.pop() || null
}

function removeExtension  (filePath: string, pathParts: string[]): string {
  // if there's a file extension
  if (pathParts.length > 1) {
    // pop the extension from the array
    pathParts.pop() as string
    return pathParts.join('.')
  }
  // if there is no file extension
  else {
    return filePath
  }
}

// these make webpack happy

export function resolveFile (filePath: string) {
  const pathParts = filePath.split('.')
  const extension = getExtension(pathParts)
  const pathWithoutExtension = removeExtension(filePath, pathParts)
  switch(extension){
    case 'js': {
      return require.resolve(pathWithoutExtension + '.js')
    }
    case 'json': {
      return require.resolve(pathWithoutExtension + '.json')
    }
    default : {
      return require.resolve(pathWithoutExtension + '.js')
    }
  }
}

// again, explicit with the extensions

export function requireFile(filePath: string){
  const pathParts = filePath.split('.')
  const extension = getExtension(pathParts)
  const pathWithoutExtension = removeExtension(filePath, pathParts)
  switch(extension){
    case 'js': {
      return require(pathWithoutExtension + '.js')
    }
    case 'json': {
      return require(pathWithoutExtension + '.json')
    }
    default : {
      if (extension) {
        throw Error(`cannot require module with extension '${extension}'`)
      }
      return require(pathWithoutExtension + '.js')
    }
  }
}
