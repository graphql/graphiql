import type { DocumentNode, GraphQLSchema } from 'graphql';
import { createContext, useContext, type ReactNode } from 'react';
import type { ArgValue } from '../lib/document-mutator';
import type { PathSegment } from '../lib/ast-path';

export type FieldTreeCallbacks = {
  onToggle: (path: PathSegment[]) => void;
  onSetArg: (path: PathSegment[], argName: string, value: ArgValue) => void;
  onPromoteArg?: (
    path: PathSegment[],
    argName: string,
    suggestedName: string,
  ) => void;
  onDemoteArg?: (path: PathSegment[], argName: string, varName: string) => void;
  onAddInlineFragment?: (path: PathSegment[], typeName: string) => void;
  onRemoveInlineFragment?: (path: PathSegment[], typeName: string) => void;
};

export type FieldTreeContextValue = FieldTreeCallbacks & {
  doc: DocumentNode;
  schema?: GraphQLSchema;
  operationName?: string;
  cursorPath?: PathSegment[];
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
