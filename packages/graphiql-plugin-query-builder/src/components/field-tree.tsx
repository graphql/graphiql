import {
  type DocumentNode,
  type GraphQLInterfaceType,
  type GraphQLObjectType,
  type GraphQLSchema,
} from 'graphql';
import { type FC, useState } from 'react';
import { isFieldSelected, type ArgValue } from '../lib/document-mutator';
import { fieldSegment, type PathSegment } from '../lib/ast-path';
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

// Internal: renders a flat list of fields for one type/path. Called recursively
// from FieldTreeNode; reads shared doc/callbacks from context.

type FieldTreeListProps = {
  type: GraphQLObjectType | GraphQLInterfaceType;
  path: PathSegment[];
};

export const FieldTreeList: FC<FieldTreeListProps> = ({ type, path }) => {
  const { doc, operationName } = useFieldTreeContext();
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState('');

  const fields = Object.values(type.getFields());
  const isLong = fields.length > FIELD_LIST_THRESHOLD;
  // Match the per-depth indent FieldRow applies, so the filter and "more" control
  // line up with the rows at this nesting level instead of spanning the pane.
  const indent = path.length * 12;
  const isSelected = (fieldName: string): boolean =>
    isFieldSelected(doc, [...path, fieldSegment(fieldName)], operationName);

  // A field under the editor cursor is always present in the document (the cursor
  // path is parsed from the query), so it is selected and already pinned visible
  // by selectVisibleFields. No cursor-specific expansion is needed here.
  const { visible, hiddenCount } = selectVisibleFields({
    fields,
    isSelected,
    threshold: FIELD_LIST_THRESHOLD,
    expanded,
    filter,
  });

  return (
    <div className="graphiql-qb-field-tree">
      {isLong && (
        <input
          type="text"
          className="graphiql-qb-field-filter"
          style={{ marginLeft: indent }}
          aria-label="Filter fields"
          placeholder="Filter fields…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      )}
      {visible.map(field => (
        <FieldTreeNode key={field.name} field={field} path={path} />
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          className="graphiql-qb-show-more"
          style={{ marginLeft: indent }}
          onClick={() => setExpanded(true)}
        >
          ...{hiddenCount} more fields
        </button>
      )}
    </div>
  );
};

// Public API: wires up the context provider and renders FieldTreeList at the root.

type FieldTreeProps = {
  type: GraphQLObjectType | GraphQLInterfaceType;
  path: PathSegment[];
  doc: DocumentNode;
  schema?: GraphQLSchema;
  operationName?: string;
  /** Absolute field path under the editor cursor; ancestors auto-expand. */
  cursorPath?: PathSegment[];
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
