import { useGraphiQL, useGraphiQLActions } from '@graphiql/react';
import {
  Kind,
  OperationTypeNode,
  type DocumentNode,
  type ValueNode,
  getNamedType,
  parse,
  parseValue,
  print,
  valueFromASTUntyped,
} from 'graphql';
import { useEffect, useRef, useState } from 'react';
import {
  addInlineFragment,
  argValueToValueNode,
  createFragmentFromSelection,
  demoteVariable,
  findOperation,
  inlineFragment,
  listFragments,
  promoteArgToVariable,
  removeFragmentSpread,
  removeInlineFragment,
  renameFragment,
  setFieldArgument,
  suggestVarName,
  toggleFieldSelection,
  type ArgValue,
  type DefinitionTarget,
} from '../lib/document-mutator';
import { findDefinition, type PathSegment } from '../lib/ast-path';
import {
  extractRawArgValue,
  readVariables,
  resolveSchemaArg,
  resolveSchemaArgFromRoot,
} from '../lib/schema-walk';
import { useCursorContext } from './use-cursor-path';

/**
 * Parse query text into a DocumentNode, or null when it's empty or unparseable
 * (callers keep the last valid document instead).
 */
function tryParse(text: string | null | undefined): DocumentNode | null {
  const src = text?.trim();
  if (!src) {
    return null;
  }
  try {
    return parse(src);
  } catch {
    return null;
  }
}

/** A minimal valid document used to seed the builder when there's no query. */
function emptyDoc(): DocumentNode {
  return parse('{ __typename }');
}

export interface UseWorkingDocumentResult {
  workingDoc: DocumentNode;
  activeOpKind: OperationTypeNode | undefined;
  /** The definition the tree currently reads and mutates (operation or fragment). */
  target: DefinitionTarget;
  /** Field path under the editor cursor, when it belongs to `target`. */
  cursorPath: PathSegment[] | undefined;
  /** Switch the active target to a named fragment (from a click). */
  handleFocusFragment: (fragmentName: string) => void;
  /** Return the active target to the operation (from a click). */
  handleBackToQuery: () => void;
  handleToggle: (path: PathSegment[]) => void;
  handleSetArg: (path: PathSegment[], argName: string, value: ArgValue) => void;
  handlePromoteArg: (
    path: PathSegment[],
    argName: string,
    suggestedName: string,
  ) => void;
  handleDemoteArg: (
    path: PathSegment[],
    argName: string,
    varName: string,
  ) => void;
  handleAddInlineFragment: (path: PathSegment[], typeName: string) => void;
  handleRemoveInlineFragment: (path: PathSegment[], typeName: string) => void;
  handleRemoveFragmentSpread: (
    path: PathSegment[],
    fragmentName: string,
  ) => void;
  handleExtractFragment: (path: PathSegment[], typeName: string) => void;
  handleRenameFragment: (oldName: string, newName: string) => void;
  /** Deletes a fragment, inlining its selections at every spread site. */
  handleDeleteFragment: (fragmentName: string) => void;
}

/**
 * Owns the working document: its state, editor write-back, echo-suppression,
 * external-edit sync, and all document-mutation handlers.
 */
export function useWorkingDocument(): UseWorkingDocumentResult {
  const schema = useGraphiQL(state => state.schema);
  const queryEditor = useGraphiQL(state => state.queryEditor);
  const variableEditor = useGraphiQL(state => state.variableEditor);
  const operationName = useGraphiQL(state => state.operationName);
  const { updateActiveTabValues } = useGraphiQLActions();

  const activeTabIndex = useGraphiQL(state => state.activeTabIndex);
  const tabs = useGraphiQL(state => state.tabs);
  const queryText = tabs[activeTabIndex]?.query;
  const variablesText = tabs[activeTabIndex]?.variables;

  // The builder owns a working document. Edits mutate it synchronously and are
  // written straight to the editor, so the tree and editor stay in step with no
  // round-trip lag. The editor is a peer, not the source of truth: its echo of
  // our own write is ignored, and only a genuine external edit replaces the
  // working document.
  const [workingDoc, setWorkingDoc] = useState<DocumentNode>(
    () => tryParse(queryText) ?? emptyDoc(),
  );

  // The exact text we last synced to the editor; an incoming queryText equal to
  // it is our own echo and must not clobber in-progress edits.
  const lastSyncedRef = useRef<string | null>(queryText ?? null);

  const writeToEditor = (printed: string) => {
    if (queryEditor) {
      // setValue updates both the model and the view reliably. (executeEdits
      // would preserve undo history, but it no-ops until the editor view is
      // laid out, which silently drops writes fired right after mount and in
      // headless test runs.) Restore the cursor afterwards so the editor's
      // cursor->operationName tracking doesn't snap to the first operation.
      const position = queryEditor.getPosition();
      queryEditor.setValue(printed);
      if (position) {
        queryEditor.setPosition(position);
      }
      lastSyncedRef.current = queryEditor.getValue();
      return;
    }
    lastSyncedRef.current = printed;
    updateActiveTabValues({ query: printed });
  };

  // Adopt a genuine external editor edit. Keep the last valid working document
  // when the in-progress text doesn't parse, so the tree doesn't flicker to
  // empty mid-edit.
  useEffect(() => {
    if (queryText === lastSyncedRef.current) {
      return; // our own echo
    }
    lastSyncedRef.current = queryText ?? null;
    const parsed = tryParse(queryText);
    if (parsed) {
      setWorkingDoc(parsed);
    } else if (!queryText?.trim()) {
      setWorkingDoc(emptyDoc());
    }
    // unparseable in-progress text: keep the last valid working document
  }, [queryText]);

  // The active operation has exactly one root type (query, mutation, or
  // subscription); that root is the only one the builder can edit.
  const activeOpKind: OperationTypeNode | undefined = findOperation(
    workingDoc,
    operationName,
  )?.operation;

  // The definition the builder edits follows the editor cursor: moving into a
  // fragment switches to editing it. A click (focus a fragment / back to query)
  // sets a manual target that holds until the cursor next moves into a
  // definition, at which point the editor takes over again.
  const cursor = useCursorContext();
  const [manualTarget, setManualTarget] = useState<DefinitionTarget | null>(
    null,
  );
  const cursorKey = cursor.target
    ? `${cursor.target.kind}:${cursor.target.name ?? ''}`
    : '';
  useEffect(() => {
    // A non-empty key means the cursor is inside a definition; the editor then
    // takes over, clearing any click-focused target.
    if (cursorKey) {
      setManualTarget(null);
    }
  }, [cursorKey]);

  const target: DefinitionTarget = manualTarget ??
    cursor.target ?? { kind: 'operation', name: operationName };

  // Auto-expand the tree to the cursor only when the cursor sits in the
  // definition we're showing; a click-focused fragment doesn't move the cursor.
  const cursorPath =
    cursor.target &&
    cursor.target.kind === target.kind &&
    cursor.target.name === target.name
      ? cursor.path
      : undefined;

  function handleFocusFragment(fragmentName: string) {
    setManualTarget({ kind: 'fragment', name: fragmentName });
  }

  function handleBackToQuery() {
    setManualTarget({ kind: 'operation', name: operationName });
  }

  // Apply a new working document: update state synchronously, then write it to
  // the editor. The write is synchronous so the query and any variables a
  // handler writes alongside it stay consistent, and so the editor reflects the
  // edit immediately (the working document is the source of truth, so there is
  // no in-flight state to debounce).
  function applyDoc(next: DocumentNode) {
    setWorkingDoc(next);
    writeToEditor(print(next));
  }

  function applyVariables(next: Record<string, unknown>) {
    const serialized = Object.keys(next).length
      ? JSON.stringify(next, null, 2)
      : '';
    if (variableEditor) {
      variableEditor.setValue(serialized);
    } else {
      updateActiveTabValues({ variables: serialized });
    }
  }

  // After a removal the mutator drops variable definitions that are no longer
  // referenced; mirror that in the variables JSON by dropping entries that no
  // operation in `next` defines anymore.
  function reconcileVariablesJson(next: ReturnType<typeof parse>) {
    const definedVars = new Set<string>();
    for (const def of next.definitions) {
      if (def.kind === Kind.OPERATION_DEFINITION) {
        for (const vd of def.variableDefinitions ?? []) {
          definedVars.add(vd.variable.name.value);
        }
      }
    }
    const vars = readVariables(variablesText);
    if (Object.keys(vars).some(name => !definedVars.has(name))) {
      const reconciled: Record<string, unknown> = {};
      for (const [name, value] of Object.entries(vars)) {
        if (definedVars.has(name)) {
          reconciled[name] = value;
        }
      }
      applyVariables(reconciled);
    }
  }

  function handleToggle(path: PathSegment[]) {
    const next = toggleFieldSelection(workingDoc, path, target);
    applyDoc(next);
    reconcileVariablesJson(next);
  }

  function schemaArgFor(path: PathSegment[], argName: string) {
    if (!schema) {
      return;
    }
    if (target.kind === 'operation') {
      return resolveSchemaArg(schema, activeOpKind, path, argName);
    }
    // A fragment's fields are walked from its type condition, not an op root.
    const def = findDefinition(workingDoc, target);
    const rootTypeName =
      def?.kind === Kind.FRAGMENT_DEFINITION
        ? def.typeCondition.name.value
        : undefined;
    const rootType = rootTypeName
      ? (schema.getType(rootTypeName) ?? undefined)
      : undefined;
    return resolveSchemaArgFromRoot(schema, rootType, path, argName);
  }

  function handleSetArg(path: PathSegment[], argName: string, value: ArgValue) {
    const schemaArg = schemaArgFor(path, argName);
    if (!schemaArg) {
      return;
    }

    const valueNode = argValueToValueNode(schemaArg.type, value);
    applyDoc(setFieldArgument(workingDoc, path, argName, valueNode, target));
  }

  function handlePromoteArg(
    path: PathSegment[],
    argName: string,
    suggestedName: string,
  ) {
    const schemaArg = schemaArgFor(path, argName);
    if (!schemaArg) {
      return;
    }

    const namedType = getNamedType(schemaArg.type);
    if (!namedType) {
      return;
    }

    const varName = suggestVarName(workingDoc, suggestedName);
    const raw = extractRawArgValue(workingDoc, path, argName, operationName);
    applyDoc(
      promoteArgToVariable(
        workingDoc,
        path,
        argName,
        varName,
        namedType.name,
        '',
        operationName,
      ),
    );
    if (raw) {
      try {
        const jsValue = valueFromASTUntyped(parseValue(raw));
        applyVariables({ ...readVariables(variablesText), [varName]: jsValue });
      } catch {
        // raw value unparseable as GraphQL — skip writing to variables
      }
    }
  }

  function handleDemoteArg(
    path: PathSegment[],
    argName: string,
    varName: string,
  ) {
    const vars = readVariables(variablesText);
    const jsValue = vars[varName];
    const schemaArg = schemaArgFor(path, argName);
    let inlineValue: ValueNode | undefined;
    if (schemaArg && jsValue !== undefined) {
      inlineValue = argValueToValueNode(schemaArg.type, String(jsValue));
    }
    applyDoc(demoteVariable(workingDoc, varName, operationName, inlineValue));
    const rest = { ...vars };
    delete rest[varName];
    applyVariables(rest);
  }

  function handleAddInlineFragment(path: PathSegment[], typeName: string) {
    applyDoc(addInlineFragment(workingDoc, path, typeName, target));
  }

  function handleRemoveInlineFragment(path: PathSegment[], typeName: string) {
    const next = removeInlineFragment(workingDoc, path, typeName, target);
    applyDoc(next);
    reconcileVariablesJson(next);
  }

  function handleRemoveFragmentSpread(
    path: PathSegment[],
    fragmentName: string,
  ) {
    const next = removeFragmentSpread(workingDoc, path, fragmentName, target);
    applyDoc(next);
    reconcileVariablesJson(next);
  }

  // Lift the selection at `path` into a new named fragment on `typeName`,
  // replacing the selection with a spread. The name is auto-generated
  // (`${typeName}Fields`, de-duped against existing fragments) and stays
  // editable afterwards from the fragment list.
  function handleExtractFragment(path: PathSegment[], typeName: string) {
    const base = `${typeName}Fields`;
    const existing = new Set(listFragments(workingDoc));
    let name = base;
    for (let n = 2; existing.has(name); n++) {
      name = `${base}_${n}`;
    }
    applyDoc(
      createFragmentFromSelection(workingDoc, path, name, typeName, target),
    );
  }

  function handleRenameFragment(oldName: string, newName: string) {
    applyDoc(renameFragment(workingDoc, oldName, newName));
  }

  function handleDeleteFragment(fragmentName: string) {
    applyDoc(inlineFragment(workingDoc, fragmentName));
    // If we were editing the deleted fragment, fall back to the operation.
    if (target.kind === 'fragment' && target.name === fragmentName) {
      setManualTarget({ kind: 'operation', name: operationName });
    }
  }

  return {
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
    handleRemoveFragmentSpread,
    handleExtractFragment,
    handleRenameFragment,
    handleDeleteFragment,
  };
}
