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
  listFragmentInfos,
} from '../lib/document-mutator';
import {
  fieldSegment,
  findOperation,
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
    operationName,
    cursorPath,
    onToggle,
    onSetArg,
    onPromoteArg,
    onDemoteArg,
    onExtractFragment,
    onSpreadFragment,
  } = useFieldTreeContext();

  const [expanded, setExpanded] = useState(false);
  const fullPath = [...path, fieldSegment(field.name)];
  const argValues = getFieldArgValues(doc, fullPath, operationName);
  const argVariables = getFieldArgVariables(doc, fullPath, operationName);

  const namedType = getNamedType(field.type);
  const isObject = isObjectType(namedType);
  const isInterface = isInterfaceType(namedType);
  const isAbstract =
    namedType !== undefined &&
    (isUnionType(namedType) || isInterfaceType(namedType));
  const selected = isFieldSelected(doc, fullPath, operationName);
  const hasChildren = isObject || isAbstract;

  // Fragments only make sense on a composite selection set that has fields to
  // lift out. An object or interface type qualifies; a bare union does not (it
  // has no directly-selectable fields of its own).
  const isFragmentTarget = isObject || isInterface;
  const operation = findOperation(doc, operationName);
  const nodeSelectionSet = operation
    ? findSelectionSet(operation.selectionSet, fullPath)
    : undefined;
  const nodeSelections = nodeSelectionSet?.selections ?? [];

  // A field whose selection set is a single fragment spread has already been
  // extracted (or spread from an existing fragment); its row shows `...Name`
  // rather than the extract/expand chrome.
  const spreadName =
    nodeSelections.length === 1 &&
    nodeSelections[0]?.kind === Kind.FRAGMENT_SPREAD
      ? nodeSelections[0].name.value
      : undefined;

  const hasExtractableSelection =
    spreadName === undefined && nodeSelections.length > 0;
  const canExtract = Boolean(
    isFragmentTarget &&
    namedType &&
    onExtractFragment &&
    expanded &&
    hasExtractableSelection,
  );

  // Offer "spread here" when this composite row can hold a fragment and the
  // document already defines one on a matching type. Skip it once the row is
  // itself a spread.
  const matchingFragments =
    isFragmentTarget &&
    namedType &&
    onSpreadFragment &&
    spreadName === undefined
      ? listFragmentInfos(doc).filter(info => info.typeName === namedType.name)
      : [];

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
        fragmentSpread={spreadName}
        onExtractFragment={handleExtract}
        spreadableFragments={matchingFragments}
        onSpreadFragment={
          onSpreadFragment && matchingFragments.length > 0
            ? name => onSpreadFragment(fullPath, name)
            : undefined
        }
        onToggle={onToggle}
        onExpand={handleExpand}
        onSetArg={onSetArg}
        onPromoteArg={onPromoteArg}
        onDemoteArg={onDemoteArg}
      />
      {spreadName === undefined &&
        isObject &&
        expanded &&
        namedType &&
        isObjectType(namedType) && (
          <FieldTreeList
            type={namedType as GraphQLObjectType}
            path={fullPath}
          />
        )}
      {spreadName === undefined && isAbstract && expanded && (
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
