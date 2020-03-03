import {
  SchemaContext,
  SchemaProvider,
  SchemaProviderProps,
} from './GraphiQLSchemaProvider';
import React, { useContext } from 'react';
import { SessionContext, SessionProvider } from './GraphiQLSessionProvider';

export const MigrationContext = React.createContext({});

// To add a new context...

const AggregateContext: React.FC = ({ children }) => {
  const schemaContext = useContext(SchemaContext);
  const sessionContext = useContext(SessionContext);
  return (
    <MigrationContext.Provider value={{ ...schemaContext, ...sessionContext }}>
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
      <SessionProvider sessionId={0} {...props}>
        <AggregateContext>{children}</AggregateContext>
      </SessionProvider>
    </SchemaProvider>
  );
};
