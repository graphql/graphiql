import { glob } from 'glob';
import { GraphQLProjectConfig } from 'graphql-config';
import {
  DEFAULT_SUPPORTED_EXTENSIONS,
  DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS,
} from './constants';

export function unwrapProjectSchema(project: GraphQLProjectConfig): string[] {
  const projectSchema = project.schema;

  const schemas: string[] = [];
  if (typeof projectSchema === 'string') {
    schemas.push(projectSchema);
  } else if (Array.isArray(projectSchema)) {
    for (const schemaEntry of projectSchema) {
      if (typeof schemaEntry === 'string') {
        schemas.push(schemaEntry);
      } else if (schemaEntry) {
        schemas.push(...Object.keys(schemaEntry));
      }
    }
  } else {
    schemas.push(...Object.keys(projectSchema));
  }

  return schemas.reduce<string[]>((agg, schema) => {
    const results = globIfFilePattern(schema);
    return [...agg, ...results];
  }, []);
}
function globIfFilePattern(pattern: string) {
  if (pattern.includes('*')) {
    try {
      return glob.sync(pattern);
      // URLs may contain * characters
    } catch {}
  }
  return [pattern];
}
const allExtensions = [
  ...DEFAULT_SUPPORTED_EXTENSIONS,
  ...DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS,
];
// only local schema lookups if all of the schema entries are local files
export function isProjectSDLOnly(unwrappedSchema: string[]): boolean {
  return unwrappedSchema.every(schemaEntry =>
    allExtensions.some(
      // local schema file URIs for lookup don't start with http, and end with an extension.
      // though it isn't often used, technically schema config could include a remote .graphql file
      ext => !schemaEntry.startsWith('http') && schemaEntry.endsWith(ext),
    ),
  );
}
