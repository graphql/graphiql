import {
  type DocumentNode,
  type GraphQLInterfaceType,
  type GraphQLObjectType,
  type GraphQLSchema,
} from 'graphql';
import { type FC, useState } from 'react';
import { isFieldSelected, type ArgValue } from '../lib/document-mutator';
import {
  FIELD_LIST_THRESHOLD,
  selectVisibleFields,
} from '../lib/field-list-view';
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
  const { doc, operationName, cursorPath } = useFieldTreeContext();
  const [expanded, setExpanded] = useState(false);

  const fields = Object.values(type.getFields());
  const isSelected = (fieldName: string): boolean =>
    isFieldSelected(doc, [...path, fieldName], operationName);

  // If the cursor targets a field at this level that the cap would hide, expand
  // so cursor-reveal can flash it. cursorPath is absolute; the field at this
  // level is the segment right after our path.
  const cursorFieldHere =
    cursorPath?.length === path.length + 1 &&
    path.every((seg, i) => cursorPath[i] === seg)
      ? cursorPath[path.length]
      : undefined;
  const cursorBeyondCap =
    cursorFieldHere !== undefined &&
    fields.findIndex(f => f.name === cursorFieldHere) >= FIELD_LIST_THRESHOLD &&
    !isSelected(cursorFieldHere);

  const { visible, hiddenCount } = selectVisibleFields({
    fields,
    isSelected,
    threshold: FIELD_LIST_THRESHOLD,
    expanded: expanded || cursorBeyondCap,
    filter: '',
  });

  return (
    <div className="graphiql-qb-field-tree">
      {visible.map(field => (
        <FieldTreeNode key={field.name} field={field} path={path} />
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          className="graphiql-qb-show-more"
          onClick={() => setExpanded(true)}
        >
          + {hiddenCount} more
        </button>
      )}
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
