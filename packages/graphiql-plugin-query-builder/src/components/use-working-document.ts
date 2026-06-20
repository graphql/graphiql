import { useGraphiQL, useGraphiQLActions } from '@graphiql/react';
import {
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
  listFragments,
  promoteArgToVariable,
  removeInlineFragment,
  setFieldArgument,
  suggestVarName,
  toggleFieldSelection,
  type ArgValue,
} from '../lib/document-mutator';
import {
  extractRawArgValue,
  readVariables,
  resolveSchemaArg,
} from '../lib/schema-walk';

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
  activeOpKind: string | undefined;
  handleToggle: (path: string[]) => void;
  handleSetArg: (path: string[], argName: string, value: ArgValue) => void;
  handlePromoteArg: (
    path: string[],
    argName: string,
    suggestedName: string,
  ) => void;
  handleDemoteArg: (path: string[], argName: string, varName: string) => void;
  handleAddInlineFragment: (path: string[], typeName: string) => void;
  handleRemoveInlineFragment: (path: string[], typeName: string) => void;
  handleCreateFragment: (
    cursorPath: string[],
    fragmentType: { name: string },
  ) => void;
}

/**
 * Owns the working document: its state, editor write-back, echo-suppression,
 * external-edit sync, and all document-mutation handlers.
 *
 * Calls `useGraphiQL`/`useGraphiQLActions` internally so selector usage stays
 * identical to what the component did before extraction.
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
  const activeOpKind: string | undefined = findOperation(
    workingDoc,
    operationName,
  )?.operation;

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
      if (def.kind === 'OperationDefinition') {
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

  function handleToggle(path: string[]) {
    const next = toggleFieldSelection(workingDoc, path, operationName);
    applyDoc(next);
    reconcileVariablesJson(next);
  }

  function schemaArgFor(path: string[], argName: string) {
    return schema
      ? resolveSchemaArg(schema, activeOpKind, path, argName)
      : undefined;
  }

  function handleSetArg(path: string[], argName: string, value: ArgValue) {
    const schemaArg = schemaArgFor(path, argName);
    if (!schemaArg) {
      return;
    }

    const valueNode = argValueToValueNode(schemaArg.type, value);
    applyDoc(
      setFieldArgument(workingDoc, path, argName, valueNode, operationName),
    );
  }

  function handlePromoteArg(
    path: string[],
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

  function handleDemoteArg(path: string[], argName: string, varName: string) {
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

  function handleAddInlineFragment(path: string[], typeName: string) {
    applyDoc(addInlineFragment(workingDoc, path, typeName, operationName));
  }

  function handleRemoveInlineFragment(path: string[], typeName: string) {
    const next = removeInlineFragment(
      workingDoc,
      path,
      typeName,
      operationName,
    );
    applyDoc(next);
    reconcileVariablesJson(next);
  }

  // A fragment can be extracted from the field the cursor is in, as long as it
  // resolves to a composite type (object or interface — those have a selection
  // set worth lifting out). cursorPath and fragmentType are passed in from the
  // component, which computes them from useCursorPath + schema.
  function handleCreateFragment(
    cursorPath: string[],
    fragmentType: { name: string },
  ) {
    const base = `${fragmentType.name}Fields`;
    const existing = new Set(listFragments(workingDoc));
    let name = base;
    for (let n = 2; existing.has(name); n++) {
      name = `${base}_${n}`;
    }
    applyDoc(
      createFragmentFromSelection(
        workingDoc,
        cursorPath,
        name,
        fragmentType.name,
        operationName,
      ),
    );
  }

  return {
    workingDoc,
    activeOpKind,
    handleToggle,
    handleSetArg,
    handlePromoteArg,
    handleDemoteArg,
    handleAddInlineFragment,
    handleRemoveInlineFragment,
    handleCreateFragment,
  };
}
