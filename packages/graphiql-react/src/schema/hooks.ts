import { useContext } from 'react';

import { SchemaContext } from './context';

export function useSchemaWithError(type: 'component' | 'hook', name: string) {
  const context = useContext(SchemaContext);
  if (!context) {
    throw new Error(
      `Tried to call the \`${name}\` ${type} without the necessary context. Make sure that the \`SchemaContextProvider\` from \`@graphiql/react\` is rendered higher in the tree.`,
    );
  }
  return context;
}

export function useSchema() {
  return useSchemaWithError('hook', 'useSchema');
}
