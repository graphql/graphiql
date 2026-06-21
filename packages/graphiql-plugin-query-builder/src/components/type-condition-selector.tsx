import { ChevronDownIcon } from '@graphiql/react';
import {
  isInterfaceType,
  isUnionType,
  type GraphQLAbstractType,
  type GraphQLInterfaceType,
  type GraphQLObjectType,
  type GraphQLSchema,
} from 'graphql';
import { type FC, useEffect, useState } from 'react';
import {
  inlineFragmentSegment,
  isInlineFragmentPresent,
  segmentsEqual,
} from '../lib/document-mutator';
import { type PathSegment } from '../lib/ast-path';
import { useFieldTreeContext } from './field-tree-context';
import { FieldTreeList } from './field-tree';
import { useCursorReveal } from './use-cursor-reveal';

/**
 * The type conditions worth offering for an abstract field: every concrete
 * object type, plus (for interface fields) the other interfaces that share an
 * implementor, so you can narrow to a sibling/sub-interface (`... on Node`).
 * The field's own interface and the interfaces it already implements are
 * skipped, since those fields are selectable directly. A union contributes just
 * its member object types.
 */
export function applicableTypeConditions(
  abstractType: GraphQLAbstractType,
  schema: GraphQLSchema,
): (GraphQLObjectType | GraphQLInterfaceType)[] {
  const objects = schema.getPossibleTypes(abstractType);
  if (!isInterfaceType(abstractType)) {
    return [...objects];
  }

  const skip = new Set<string>([
    abstractType.name,
    ...abstractType.getInterfaces().map(i => i.name),
  ]);
  const interfaces = new Map<string, GraphQLInterfaceType>();
  for (const object of objects) {
    for (const iface of object.getInterfaces()) {
      if (!skip.has(iface.name)) {
        interfaces.set(iface.name, iface);
      }
    }
  }
  return [...objects, ...interfaces.values()];
}

// ---------------------------------------------------------------------------
// TypeConditionSelector
// ---------------------------------------------------------------------------

type TypeConditionSelectorProps = {
  fieldPath: PathSegment[];
  abstractType: GraphQLAbstractType;
};

export const TypeConditionSelector: FC<TypeConditionSelectorProps> = ({
  fieldPath,
  abstractType,
}) => {
  const { doc, schema, operationName, cursorPath } = useFieldTreeContext();
  // Whether the document currently has a type condition selected under this
  // field. Recomputed each render so a fragment added after mount can open the
  // section (see the effect below).
  const hasSelectedCondition = (
    schema ? applicableTypeConditions(abstractType, schema) : []
  ).some(t => isInlineFragmentPresent(doc, fieldPath, t.name, operationName));
  const [expanded, setExpanded] = useState(hasSelectedCondition);

  // Open the section when a type condition becomes selected in the document.
  // Only opens, never force-closes, so the user can still collapse it manually.
  useEffect(() => {
    if (hasSelectedCondition) {
      setExpanded(true);
    }
  }, [hasSelectedCondition]);

  // Open the section when the editor cursor sits inside one of its type
  // conditions, so the reveal can cascade down to a field nested in a
  // `... on TypeName`. (A condition contributes an inlineFragment path segment
  // right after this field's path; a directly-selectable interface field does
  // not, so it won't force the section open.)
  const cursorInCondition =
    cursorPath !== undefined &&
    cursorPath.length > fieldPath.length &&
    fieldPath.every((seg, i) => segmentsEqual(cursorPath[i]!, seg)) &&
    cursorPath[fieldPath.length]?.kind === 'inlineFragment';
  useEffect(() => {
    if (cursorInCondition) {
      setExpanded(true);
    }
  }, [cursorPath, cursorInCondition]);

  if (!schema) {
    return null;
  }

  const typeConditions = applicableTypeConditions(abstractType, schema);

  if (typeConditions.length === 0) {
    return null;
  }

  const entries = (
    <div
      className="graphiql-qb-type-condition"
      role="group"
      aria-label={`Possible types for ${abstractType.name}`}
    >
      {typeConditions.map(conditionType => {
        const isSelected = isInlineFragmentPresent(
          doc,
          fieldPath,
          conditionType.name,
          operationName,
        );

        return (
          <TypeConditionEntry
            key={conditionType.name}
            fieldPath={fieldPath}
            typeName={conditionType.name}
            concreteType={conditionType}
            isInterface={isInterfaceType(conditionType)}
            isSelected={isSelected}
          />
        );
      })}
    </div>
  );

  // A union has no fields of its own, so its type conditions are the only
  // content under the field; render them directly rather than behind a
  // collapse. Interfaces fold them into a labeled, collapsible section.
  if (isUnionType(abstractType)) {
    return entries;
  }

  return (
    <div className="graphiql-qb-possible-types">
      <button
        type="button"
        className="graphiql-qb-field-toggle graphiql-qb-possible-types-header"
        style={{
          paddingLeft: `calc(${fieldPath.length * 12}px + var(--px-8))`,
        }}
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
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
        <span className="graphiql-qb-possible-types-label">Possible types</span>
        <span className="graphiql-qb-possible-types-count">
          {typeConditions.length}
        </span>
      </button>
      {expanded && entries}
    </div>
  );
};

// ---------------------------------------------------------------------------
// TypeConditionEntry
// ---------------------------------------------------------------------------

type TypeConditionEntryProps = {
  fieldPath: PathSegment[];
  typeName: string;
  concreteType: GraphQLObjectType | GraphQLInterfaceType;
  /** Whether this type condition is an interface (matches several types). */
  isInterface: boolean;
  isSelected: boolean;
};

const TypeConditionEntry: FC<TypeConditionEntryProps> = ({
  fieldPath,
  typeName,
  concreteType,
  isInterface,
  isSelected,
}) => {
  const { cursorPath, onAddInlineFragment, onRemoveInlineFragment } =
    useFieldTreeContext();
  const [expanded, setExpanded] = useState(false);
  const fragmentPath = [...fieldPath, inlineFragmentSegment(typeName)];
  const { flash, current, nodeRef } = useCursorReveal(
    fragmentPath,
    cursorPath,
    setExpanded,
  );

  function handleToggle() {
    if (isSelected) {
      onRemoveInlineFragment?.(fieldPath, typeName);
    } else {
      onAddInlineFragment?.(fieldPath, typeName);
    }
  }

  return (
    <div
      className={`graphiql-qb-inline-fragment${
        flash ? ' graphiql-qb-flash' : ''
      }${current ? ' graphiql-qb-current' : ''}`}
      ref={nodeRef}
    >
      <div
        className="graphiql-qb-inline-fragment-header"
        style={{
          paddingLeft: `calc(${fieldPath.length * 12}px + var(--px-8))`,
        }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleToggle}
          aria-label={`Toggle ... on ${typeName}`}
          className="graphiql-qb-field-checkbox"
        />
        <button
          type="button"
          className="graphiql-qb-field-toggle"
          onClick={() => setExpanded(prev => !prev)}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ... on ${typeName}`}
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
          <span className="graphiql-qb-inline-fragment-label">
            <span className="graphiql-qb-spread">...</span>
            {' on '}
            <span className="graphiql-qb-type-name">{typeName}</span>
            {isInterface && (
              <span className="graphiql-qb-type-kind-tag">interface</span>
            )}
          </span>
        </button>
      </div>
      {expanded && (
        <>
          <FieldTreeList type={concreteType} path={fragmentPath} />
          {/* When the condition is itself an interface, keep recursing: offer
              its own possible types so you can narrow further (`... on Node`
              then `... on Concrete`). */}
          {isInterface && (
            <TypeConditionSelector
              fieldPath={fragmentPath}
              abstractType={concreteType as GraphQLAbstractType}
            />
          )}
        </>
      )}
    </div>
  );
};
