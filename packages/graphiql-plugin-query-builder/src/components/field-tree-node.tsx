import {
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
import { useFieldTreeContext } from './field-tree-context';
import { FieldTreeList } from './field-tree';
import { FieldRow } from './field-row';
import { TypeConditionSelector } from './type-condition-selector';
import { useCursorReveal } from './use-cursor-reveal';

type FieldTreeNodeProps = {
  field: GraphQLField<unknown, unknown>;
  path: string[];
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
  } = useFieldTreeContext();

  const [expanded, setExpanded] = useState(false);
  const fullPath = [...path, field.name];
  const argValues = getFieldArgValues(doc, fullPath, operationName);
  const argVariables = getFieldArgVariables(doc, fullPath, operationName);

  const namedType = getNamedType(field.type);
  const isObject = isObjectType(namedType);
  const isAbstract =
    namedType !== undefined &&
    (isUnionType(namedType) || isInterfaceType(namedType));
  const selected = isFieldSelected(doc, fullPath, operationName);
  const hasChildren = isObject || isAbstract;

  const { flash, current, nodeRef } = useCursorReveal(
    fullPath,
    cursorPath,
    setExpanded,
  );

  function handleExpand() {
    setExpanded(prev => !prev);
  }

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
        onToggle={onToggle}
        onExpand={handleExpand}
        onSetArg={onSetArg}
        onPromoteArg={onPromoteArg}
        onDemoteArg={onDemoteArg}
      />
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
