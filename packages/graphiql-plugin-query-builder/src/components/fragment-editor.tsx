import { ChevronLeftIcon } from '@graphiql/react';
import {
  Kind,
  isInterfaceType,
  isObjectType,
  type DocumentNode,
  type GraphQLInterfaceType,
  type GraphQLObjectType,
  type GraphQLSchema,
} from 'graphql';
import type { FC } from 'react';
import {
  findDefinition,
  type DefinitionTarget,
  type PathSegment,
} from '../lib/ast-path';
import type { ArgValue } from '../lib/document-mutator';
import { FieldTree } from './field-tree';

type FragmentEditorProps = {
  fragmentName: string;
  doc: DocumentNode;
  schema: GraphQLSchema;
  target: DefinitionTarget;
  cursorPath?: PathSegment[];
  onBack: () => void;
  onToggle: (path: PathSegment[]) => void;
  onSetArg: (path: PathSegment[], argName: string, value: ArgValue) => void;
  onAddInlineFragment: (path: PathSegment[], typeName: string) => void;
  onRemoveInlineFragment: (path: PathSegment[], typeName: string) => void;
  onExtractFragment: (path: PathSegment[], typeName: string) => void;
  onRenameFragment: (oldName: string, newName: string) => void;
  onFocusFragment: (fragmentName: string) => void;
};

/**
 * The focused view for editing one named fragment. The tree is rooted at the
 * fragment's type condition, so ticking fields edits the fragment itself (and,
 * with it, every field that spreads it). "Back to query" returns to the
 * operation.
 */
export const FragmentEditor: FC<FragmentEditorProps> = ({
  fragmentName,
  doc,
  schema,
  target,
  cursorPath,
  onBack,
  onToggle,
  onSetArg,
  onAddInlineFragment,
  onRemoveInlineFragment,
  onExtractFragment,
  onRenameFragment,
  onFocusFragment,
}) => {
  const definition = findDefinition(doc, target);
  const typeName =
    definition?.kind === Kind.FRAGMENT_DEFINITION
      ? definition.typeCondition.name.value
      : undefined;
  const rootType = typeName ? schema.getType(typeName) : undefined;
  const editable =
    rootType != null && (isObjectType(rootType) || isInterfaceType(rootType));

  return (
    <section
      className="graphiql-qb-fragment-editor"
      aria-label="Fragment editor"
    >
      <div className="graphiql-qb-fragment-editor-header">
        <button
          type="button"
          className="graphiql-qb-fragment-back"
          onClick={onBack}
          aria-label="Back to query"
        >
          <ChevronLeftIcon />
          <span>Back to query</span>
        </button>
        <div className="graphiql-qb-fragment-editor-title">
          <span className="graphiql-qb-fragment-editor-name">
            {fragmentName}
          </span>
          {typeName && (
            <span className="graphiql-qb-fragment-editor-type">
              on {typeName}
            </span>
          )}
        </div>
      </div>
      {editable ? (
        <FieldTree
          type={rootType as GraphQLObjectType | GraphQLInterfaceType}
          path={[]}
          doc={doc}
          schema={schema}
          target={target}
          cursorPath={cursorPath}
          onToggle={onToggle}
          onSetArg={onSetArg}
          onAddInlineFragment={onAddInlineFragment}
          onRemoveInlineFragment={onRemoveInlineFragment}
          onExtractFragment={onExtractFragment}
          onRenameFragment={onRenameFragment}
          onFocusFragment={onFocusFragment}
        />
      ) : (
        <p className="graphiql-qb-empty">
          This fragment&rsquo;s type has no editable fields.
        </p>
      )}
    </section>
  );
};
