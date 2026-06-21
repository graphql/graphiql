import {
  Kind,
  type ArgumentNode,
  type DocumentNode,
  type FieldNode,
  type SelectionSetNode,
  type ValueNode,
  type VariableDefinitionNode,
} from 'graphql';

import {
  mapOperation,
  setArgInSelectionSet,
  type PathSegment,
} from './ast-path';
import { rawToValueNode } from './arg-value';

/**
 * Suggests a variable name for `argName` that does not collide with any
 * existing variable definition anywhere in `doc`. The check spans every
 * operation because the variables editor is a single document-wide JSON
 * object: two operations sharing a variable name would share its value.
 * Returns `argName` when no collision exists, otherwise appends `_2`, `_3`, etc.
 */
export function suggestVarName(doc: DocumentNode, argName: string): string {
  const existingNames = new Set<string>();
  for (const def of doc.definitions) {
    if (def.kind === Kind.OPERATION_DEFINITION) {
      for (const vd of def.variableDefinitions ?? []) {
        existingNames.add(vd.variable.name.value);
      }
    }
  }

  if (!existingNames.has(argName)) {
    return argName;
  }
  let i = 2;
  while (existingNames.has(`${argName}_${i}`)) {
    i++;
  }
  return `${argName}_${i}`;
}

/**
 * Promotes a scalar argument on the field at `path` to a variable reference.
 * Adds `($varName: type = defaultRaw)` to the target operation's (by name, or
 * the first operation when unspecified) variable definitions and replaces the
 * inline argument value with `$varName`.
 *
 * When the operation is anonymous (shorthand query), it is converted to an
 * explicit `query` operation so that variable definitions can be added.
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function promoteArgToVariable(
  doc: DocumentNode,
  path: PathSegment[],
  argName: string,
  varName: string,
  type: string,
  defaultRaw: string,
  operationName?: string,
): DocumentNode {
  const defaultValue = rawToValueNode(defaultRaw);
  const varDef: VariableDefinitionNode = {
    kind: Kind.VARIABLE_DEFINITION,
    variable: {
      kind: Kind.VARIABLE,
      name: { kind: Kind.NAME, value: varName },
    },
    type: {
      kind: Kind.NAMED_TYPE,
      name: { kind: Kind.NAME, value: type },
    },
    defaultValue,
    directives: [],
  };

  const varValueNode: ValueNode = {
    kind: Kind.VARIABLE,
    name: { kind: Kind.NAME, value: varName },
  };

  return mapOperation(doc, operationName, operation => {
    const newSelectionSet = setArgInSelectionSet(
      operation.selectionSet,
      path,
      argName,
      varValueNode,
    );

    // The arg path didn't resolve, so nothing now references the variable; bail
    // before defining one that would dangle. (print upgrades a shorthand query
    // to `query (...) { ... }` automatically once it carries variable definitions.)
    if (newSelectionSet === operation.selectionSet) {
      return operation;
    }

    const existingVarDefs = operation.variableDefinitions ?? [];
    // Don't redefine a variable that already exists, e.g. promoting twice.
    const variableDefinitions = existingVarDefs.some(
      vd => vd.variable.name.value === varName,
    )
      ? existingVarDefs
      : [...existingVarDefs, varDef];

    return {
      ...operation,
      variableDefinitions,
      selectionSet: newSelectionSet,
    };
  });
}

export function replaceVariableInSelectionSet(
  selectionSet: SelectionSetNode,
  varName: string,
  defaultValue: ValueNode | undefined,
): SelectionSetNode {
  const newSelections = selectionSet.selections.map(selection => {
    if (selection.kind === Kind.INLINE_FRAGMENT) {
      return {
        ...selection,
        selectionSet: replaceVariableInSelectionSet(
          selection.selectionSet,
          varName,
          defaultValue,
        ),
      };
    }

    if (selection.kind !== Kind.FIELD) {
      return selection;
    }

    const field = selection as FieldNode;
    const existingArgs = field.arguments ?? [];
    const newArgs = existingArgs
      .map(arg => {
        if (
          arg.value.kind === Kind.VARIABLE &&
          arg.value.name.value === varName
        ) {
          if (defaultValue === undefined) {
            return null;
          } // remove the arg
          return { ...arg, value: defaultValue };
        }
        return arg;
      })
      .filter((a): a is ArgumentNode => a !== null);

    const updatedField: FieldNode = {
      ...field,
      arguments: newArgs,
      selectionSet: field.selectionSet
        ? replaceVariableInSelectionSet(
            field.selectionSet,
            varName,
            defaultValue,
          )
        : undefined,
    };
    return updatedField;
  });

  return { ...selectionSet, selections: newSelections };
}

/**
 * Demotes a variable back to an inline literal. Removes the variable
 * definition for `varName` from the target operation (by name, or the first
 * operation when unspecified) and replaces every `$varName` argument reference
 * with `inlineValue` when provided, otherwise the variable's default value
 * (or removes the arg entirely when there is neither).
 *
 * Returns a new `DocumentNode`; does not mutate `doc`.
 */
export function demoteVariable(
  doc: DocumentNode,
  varName: string,
  operationName?: string,
  inlineValue?: ValueNode,
): DocumentNode {
  return mapOperation(doc, operationName, operation => {
    const varDefs = operation.variableDefinitions ?? [];
    const targetDef = varDefs.find(vd => vd.variable.name.value === varName);
    if (!targetDef) {
      return operation;
    }

    const value: ValueNode | undefined = inlineValue ?? targetDef.defaultValue;

    const newVarDefs = varDefs.filter(vd => vd.variable.name.value !== varName);
    const newSelectionSet = replaceVariableInSelectionSet(
      operation.selectionSet,
      varName,
      value,
    );

    return {
      ...operation,
      variableDefinitions: newVarDefs,
      selectionSet: newSelectionSet,
    };
  });
}
