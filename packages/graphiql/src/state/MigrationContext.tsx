import {
  SchemaContext,
  SchemaProvider,
  SchemaProviderProps,
} from './GraphiQLSchemaProvider';
import React, { useContext, useRef } from 'react';

export const MigrationContext = React.createContext({});

// To add a new context...

const AggregateContext: React.FC = ({ children }) => {
  const schemaContext = useContext(SchemaContext); // 1. consume the context via useContext
  const contexts = useRef({ schema: schemaContext }); // 2. add it to the migration's aggregate context

  return (
    <MigrationContext.Provider value={contexts}>
      {children}
    </MigrationContext.Provider>
  );
};

export const MigrationContextProvider: React.FC<SchemaProviderProps> = ({
  // 3. Union its props here
  children,
  ...props
}) => {
  return (
    // 4. Wrap it around this section
    <SchemaProvider {...props}>
      <AggregateContext>{children}</AggregateContext>
    </SchemaProvider>
  );
};
