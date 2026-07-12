import {
  ChevronDownIcon,
  MethodPill,
  PanelHeader,
  useGraphiQL,
} from '@graphiql/react';
import { OperationTypeNode } from 'graphql';
import { type FC, useEffect, useState } from 'react';
import { countSelectedFields } from '../lib/schema-walk';
import { FragmentSection } from './fragment-section';
import { FragmentEditor } from './fragment-editor';
import { FieldTree } from './field-tree';
import { useWorkingDocument } from './use-working-document';
import './../style.css';

export const QueryBuilder: FC = () => {
  const schema = useGraphiQL(state => state.schema);
  const operationName = useGraphiQL(state => state.operationName);

  const {
    workingDoc,
    activeOpKind,
    target,
    cursorPath,
    handleFocusFragment,
    handleBackToQuery,
    handleToggle,
    handleSetArg,
    handlePromoteArg,
    handleDemoteArg,
    handleAddInlineFragment,
    handleRemoveInlineFragment,
    handleExtractFragment,
    handleRenameFragment,
  } = useWorkingDocument();

  // Per-root manual collapse/expand overrides, keyed by operation kind. Reset
  // whenever the active operation kind changes so the newly active root opens.
  const [manualExpanded, setManualExpanded] = useState<Record<string, boolean>>(
    {},
  );
  useEffect(() => {
    setManualExpanded({});
  }, [activeOpKind]);

  const header = (
    <PanelHeader
      title="Query builder"
      subtitle="Tick fields to add them. Edits flow both ways with the editor."
    />
  );

  if (!schema) {
    return (
      <div className="graphiql-query-builder">
        {header}
        <p className="graphiql-qb-empty">No schema loaded.</p>
      </div>
    );
  }

  const rootTypes = [
    OperationTypeNode.QUERY,
    OperationTypeNode.MUTATION,
    OperationTypeNode.SUBSCRIPTION,
  ]
    .map(op => ({ op, type: schema.getRootType(op) }))
    .filter(
      (r): r is { op: OperationTypeNode; type: NonNullable<typeof r.type> } =>
        Boolean(r.type),
    );

  const selectedCount = countSelectedFields(workingDoc, operationName);

  return (
    <div className="graphiql-query-builder">
      {header}
      <div className="graphiql-qb-body">
        {target.kind === 'fragment' ? (
          <FragmentEditor
            fragmentName={target.name}
            doc={workingDoc}
            schema={schema}
            target={target}
            cursorPath={cursorPath}
            onBack={handleBackToQuery}
            onToggle={handleToggle}
            onSetArg={handleSetArg}
            onAddInlineFragment={handleAddInlineFragment}
            onRemoveInlineFragment={handleRemoveInlineFragment}
            onExtractFragment={handleExtractFragment}
            onRenameFragment={handleRenameFragment}
            onFocusFragment={handleFocusFragment}
          />
        ) : (
          rootTypes.map(({ op: opKind, type: rootType }) => {
            const isActiveRoot = opKind === activeOpKind;
            const expanded = manualExpanded[opKind] ?? isActiveRoot;
            return (
              <section
                key={rootType.name}
                className="graphiql-qb-root-section"
                data-active={isActiveRoot ? 'true' : 'false'}
              >
                <button
                  type="button"
                  className="graphiql-qb-op-header"
                  disabled={!isActiveRoot}
                  aria-expanded={expanded}
                  title={
                    isActiveRoot
                      ? undefined
                      : `Move the cursor into a ${opKind} operation to edit ${rootType.name} fields`
                  }
                  onClick={() =>
                    setManualExpanded(prev => ({
                      ...prev,
                      [opKind]: !expanded,
                    }))
                  }
                >
                  <span
                    className={
                      expanded
                        ? 'graphiql-qb-chevron-expanded'
                        : 'graphiql-qb-chevron-collapsed'
                    }
                  >
                    <ChevronDownIcon />
                  </span>
                  <MethodPill operation={opKind} />
                  <span className="graphiql-qb-op-name graphiql-qb-root-name">
                    {rootType.name}
                  </span>
                  {isActiveRoot && (
                    <span className="graphiql-qb-op-count">
                      {selectedCount} selected
                    </span>
                  )}
                </button>
                {expanded && (
                  <FieldTree
                    type={rootType}
                    path={[]}
                    doc={workingDoc}
                    schema={schema ?? undefined}
                    target={target}
                    cursorPath={isActiveRoot ? cursorPath : undefined}
                    onToggle={handleToggle}
                    onSetArg={handleSetArg}
                    onPromoteArg={handlePromoteArg}
                    onDemoteArg={handleDemoteArg}
                    onAddInlineFragment={handleAddInlineFragment}
                    onRemoveInlineFragment={handleRemoveInlineFragment}
                    onExtractFragment={handleExtractFragment}
                    onRenameFragment={handleRenameFragment}
                    onFocusFragment={handleFocusFragment}
                  />
                )}
              </section>
            );
          })
        )}
        <FragmentSection
          doc={workingDoc}
          activeFragmentName={
            target.kind === 'fragment' ? target.name : undefined
          }
          onFocusFragment={handleFocusFragment}
          onRenameFragment={handleRenameFragment}
        />
      </div>
    </div>
  );
};
