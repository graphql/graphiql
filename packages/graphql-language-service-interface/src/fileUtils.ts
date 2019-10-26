import fs from "fs";

export function getFileExtension(filePath: string): string | null {
  const pathParts = /^.+\.([^.]+)$/.exec(filePath);
  // if there's a file extension
  if (pathParts && pathParts.length > 1) {
    return pathParts[1]
  }
  return null
}
export function getPathWithoutExtension(filePath: string, extension: string | null) {
  let pathWithoutExtension = filePath 
  if (extension) {
    pathWithoutExtension = filePath.substr(0, filePath.length - (extension.length + 1))
  }
  return pathWithoutExtension
}

// these make webpack happy

export function resolveFile (filePath: string) {
  const extension = getFileExtension(filePath)
  const pathWithoutExtension = getPathWithoutExtension(filePath, extension)
  switch(extension){
    case 'js': {
      return require.resolve(pathWithoutExtension + '.js')
    }
    case 'json': {
      return require.resolve(pathWithoutExtension + '.json')
    }
    default : {
      if (extension) {
        throw Error(`cannot require.resolve() module with extension '${extension}'`)
      }
      return require.resolve(pathWithoutExtension + '.js')
    }
  }
}

// again, explicit with the extensions

export function requireFile(filePath: string){
  const extension = getFileExtension(filePath)
  const pathWithoutExtension = getPathWithoutExtension(filePath, extension)
  switch(extension){
    case 'js': {
      return require(pathWithoutExtension + '.js')
    }
    case 'json': {
      return require(pathWithoutExtension + '.json')
    }
    default : {
      if (fs.existsSync(filePath + `.js`)) {
        return require(filePath + '.js')
      }
      if (fs.existsSync(filePath + `.json`)) {
        return require(filePath + '.json')
      }
      if (extension) {
        throw Error(`cannot require() module with extension '${extension}'`)
      }
    }
  }
}
