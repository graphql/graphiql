import {
  type DocumentNode,
  type GraphQLInterfaceType,
  type GraphQLObjectType,
  type GraphQLSchema,
} from 'graphql';
import { type FC } from 'react';
import type { ArgValue } from '../lib/document-mutator';
import {
  FieldTreeProvider,
  type FieldTreeContextValue,
  useFieldTreeContext,
} from './field-tree-context';
import { FieldTreeNode } from './field-tree-node';

// ---------------------------------------------------------------------------
// FieldTreeList — internal: renders a list of fields for a given type/path,
// reading shared state from context. Used by recursive calls inside the tree.
// ---------------------------------------------------------------------------

type FieldTreeListProps = {
  type: GraphQLObjectType | GraphQLInterfaceType;
  path: string[];
};

export const FieldTreeList: FC<FieldTreeListProps> = ({ type, path }) => {
  // Verify we're inside a provider (throws in dev if not).
  useFieldTreeContext();

  const fields = Object.values(type.getFields());
  return (
    <div className="graphiql-qb-field-tree">
      {fields.map(field => (
        <FieldTreeNode key={field.name} field={field} path={path} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// FieldTree — public API: sets up the context provider then renders FieldTreeList.
// Called from query-builder.tsx with the full callback bundle.
// ---------------------------------------------------------------------------

type FieldTreeProps = {
  type: GraphQLObjectType | GraphQLInterfaceType;
  path: string[];
  doc: DocumentNode;
  schema?: GraphQLSchema;
  operationName?: string;
  /** Absolute field path under the editor cursor; ancestors auto-expand. */
  cursorPath?: string[];
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

export const FieldTree: FC<FieldTreeProps> = ({
  type,
  path,
  doc,
  schema,
  operationName,
  cursorPath,
  onToggle,
  onSetArg,
  onPromoteArg,
  onDemoteArg,
  onAddInlineFragment,
  onRemoveInlineFragment,
}) => {
  const contextValue: FieldTreeContextValue = {
    doc,
    schema,
    operationName,
    cursorPath,
    onToggle,
    onSetArg,
    onPromoteArg,
    onDemoteArg,
    onAddInlineFragment,
    onRemoveInlineFragment,
  };

  return (
    <FieldTreeProvider value={contextValue}>
      <FieldTreeList type={type} path={path} />
    </FieldTreeProvider>
  );
};
