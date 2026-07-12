import {
  Kind,
  getNamedType,
  isInterfaceType,
  isObjectType,
  isUnionType,
  type GraphQLAbstractType,
  type GraphQLField,
  type GraphQLInterfaceType,
  type GraphQLObjectType,
} from 'graphql';
import { type FC, useState } from 'react';
import {
  getFieldArgValues,
  getFieldArgVariables,
  isFieldSelected,
} from '../lib/document-mutator';
import {
  fieldSegment,
  findDefinition,
  findSelectionSet,
  type PathSegment,
} from '../lib/ast-path';
import { useFieldTreeContext } from './field-tree-context';
import { FieldTreeList } from './field-tree';
import { FieldRow } from './field-row';
import { TypeConditionSelector } from './type-condition-selector';
import { useCursorReveal } from './use-cursor-reveal';

type FieldTreeNodeProps = {
  field: GraphQLField<unknown, unknown>;
  path: PathSegment[];
};

export const FieldTreeNode: FC<FieldTreeNodeProps> = ({ field, path }) => {
  const {
    doc,
    schema,
    target,
    cursorPath,
    onToggle,
    onSetArg,
    onPromoteArg,
    onDemoteArg,
    onExtractFragment,
  } = useFieldTreeContext();

  const [expanded, setExpanded] = useState(false);
  const fullPath = [...path, fieldSegment(field.name)];
  const argValues = getFieldArgValues(doc, fullPath, target);
  const argVariables = getFieldArgVariables(doc, fullPath, target);

  const namedType = getNamedType(field.type);
  const isObject = isObjectType(namedType);
  const isInterface = isInterfaceType(namedType);
  const isAbstract =
    namedType !== undefined &&
    (isUnionType(namedType) || isInterfaceType(namedType));
  const selected = isFieldSelected(doc, fullPath, target);
  const hasChildren = isObject || isAbstract;

  // Fragments only make sense on a composite selection set that has fields to
  // lift out. An object or interface type qualifies; a bare union does not (it
  // has no directly-selectable fields of its own).
  const isFragmentTarget = isObject || isInterface;
  const definition = findDefinition(doc, target);
  const nodeSelectionSet = definition
    ? findSelectionSet(definition.selectionSet, fullPath)
    : undefined;
  const nodeSelections = nodeSelectionSet?.selections ?? [];

  // Fragment spreads sitting in this field's selection (e.g. after extraction,
  // `person { ...PersonFields }`) render as reference rows among the field's
  // children. The field itself stays a normal, editable composite — ticking
  // more fields adds them alongside the spread in the base query.
  const spreadRefs = nodeSelections
    .filter(s => s.kind === Kind.FRAGMENT_SPREAD)
    .map(s => s.name.value);

  // Offer extraction only when there's a concrete selection to lift out — a
  // bare spread has nothing new to extract.
  const hasExtractableSelection = nodeSelections.some(
    s => s.kind === Kind.FIELD || s.kind === Kind.INLINE_FRAGMENT,
  );
  const canExtract = Boolean(
    isFragmentTarget &&
    namedType &&
    onExtractFragment &&
    expanded &&
    hasExtractableSelection,
  );

  const { flash, current, nodeRef } = useCursorReveal(
    fullPath,
    cursorPath,
    setExpanded,
  );

  function handleExpand() {
    setExpanded(prev => !prev);
  }

  const handleExtract =
    canExtract && namedType
      ? () => onExtractFragment!(fullPath, namedType.name)
      : undefined;

  return (
    <div className="graphiql-qb-field-node" ref={nodeRef}>
      <FieldRow
        field={field}
        path={path}
        selected={selected}
        hasChildren={hasChildren}
        expanded={expanded}
        flash={flash}
        current={current}
        argValues={argValues}
        argVariables={argVariables}
        onExtractFragment={handleExtract}
        onToggle={onToggle}
        onExpand={handleExpand}
        onSetArg={onSetArg}
        onPromoteArg={onPromoteArg}
        onDemoteArg={onDemoteArg}
      />
      {expanded && spreadRefs.length > 0 && (
        <ul
          className="graphiql-qb-fragment-refs"
          role="list"
          style={{ paddingLeft: fullPath.length * 12 }}
        >
          {spreadRefs.map(name => (
            <li key={name} className="graphiql-qb-fragment-ref-item">
              <span
                className="graphiql-qb-fragment-ref"
                data-testid="fragment-ref"
              >
                <span className="graphiql-qb-spread">...</span>
                {name}
              </span>
            </li>
          ))}
        </ul>
      )}
      {isObject && expanded && namedType && isObjectType(namedType) && (
        <FieldTreeList type={namedType as GraphQLObjectType} path={fullPath} />
      )}
      {isAbstract && expanded && (
        <>
          {/* Interface fields shared by every implementor can be selected
              directly, without a type condition. Unions have no such fields. */}
          {namedType && isInterfaceType(namedType) && (
            <FieldTreeList
              type={namedType as GraphQLInterfaceType}
              path={fullPath}
            />
          )}
          {schema && namedType && (
            <TypeConditionSelector
              fieldPath={fullPath}
              abstractType={namedType as GraphQLAbstractType}
            />
          )}
        </>
      )}
    </div>
  );
};
