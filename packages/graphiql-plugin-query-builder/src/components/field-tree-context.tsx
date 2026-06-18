import type { DocumentNode, GraphQLSchema } from 'graphql';
import { createContext, useContext, type ReactNode } from 'react';
import type { ArgValue } from '../lib/document-mutator';

export type FieldTreeCallbacks = {
  onToggle: (path: string[]) => void;
  onSetArg: (path: string[], argName: string, value: ArgValue) => void;
  onPromoteArg?: (
    path: string[],
    argName: string,
    suggestedName: string,
  ) => void;
  onDemoteArg?: (path: string[], argName: string, varName: string) => void;
  onAddInlineFragment?: (path: string[], typeName: string) => void;
  onRemoveInlineFragment?: (path: string[], typeName: string) => void;
};

export type FieldTreeContextValue = FieldTreeCallbacks & {
  doc: DocumentNode;
  schema?: GraphQLSchema;
  operationName?: string;
  cursorPath?: string[];
};

const FieldTreeContext = createContext<FieldTreeContextValue | null>(null);

export function useFieldTreeContext(): FieldTreeContextValue {
  const ctx = useContext(FieldTreeContext);
  if (!ctx) {
    throw new Error(
      'useFieldTreeContext must be used inside FieldTreeProvider',
    );
  }
  return ctx;
}

type FieldTreeProviderProps = {
  value: FieldTreeContextValue;
  children: ReactNode;
};

export function FieldTreeProvider({ value, children }: FieldTreeProviderProps) {
  return (
    <FieldTreeContext.Provider value={value}>
      {children}
    </FieldTreeContext.Provider>
  );
}
