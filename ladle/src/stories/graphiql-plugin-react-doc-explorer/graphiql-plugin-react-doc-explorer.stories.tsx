import { SchemaContext, SchemaContextType } from '@graphiql/react';

// components
import { DocExplorer } from '@graphiql/plugin-react-doc-explorer';

// utils
import { testSchema } from '../../utils/testSchema';

const defaultSchemaContext: SchemaContextType = {
  fetchError: null,
  introspect() {},
  isFetching: false,
  schema: testSchema,
  validationErrors: [],
};

export const DocExplorerStory = () => {
  return (
    <SchemaContext.Provider value={defaultSchemaContext}>
      <DocExplorer />
    </SchemaContext.Provider>
  );
};

DocExplorerStory.storyName = 'DocExplorer';
