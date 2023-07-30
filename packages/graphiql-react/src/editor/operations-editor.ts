import type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';
import type { DocumentNode } from 'graphql';
import { useEffect, useRef } from 'react';

import { useExecutionContext } from '../execution';
import { useExplorerContext } from '../explorer';
import { DOC_EXPLORER_PLUGIN, usePluginContext } from '../plugin';
import { useSchemaContext } from '../schema';
import { useStorageContext } from '../storage';
import debounce from '../utility/debounce';
import { DEFAULT_EDITOR_THEME, DEFAULT_KEY_MAP } from './common';
import { useEditorContext } from './context';
import {
  useCopyQuery,
  UseCopyQueryArgs,
  useMergeQuery,
  usePrettifyEditors,
} from './hooks';
import { WriteableEditorProps } from './types';
import { KeyCode, KeyMod } from 'monaco-graphql/esm/monaco-editor.js';
import { MONACO_GRAPHQL_API, OPERATIONS_MODEL } from '@/constants';
import { createEditor } from '@/create-editor';

export type UseQueryEditorArgs = WriteableEditorProps &
  Pick<UseCopyQueryArgs, 'onCopyQuery'> & {
    /**
     * Invoked when a reference to the GraphQL schema (type or field) is clicked
     * as part of the editor or one of its tooltips.
     * @param reference The reference that has been clicked.
     */
    onClickReference?(reference: SchemaReference): void;
    /**
     * Invoked when the contents of the query editor change.
     * @param value The new contents of the editor.
     * @param documentAST The editor contents parsed into a GraphQL document.
     */
    onEdit?(value: string, documentAST?: DocumentNode): void;
  };

export function useQueryEditor(
  {
    editorTheme = DEFAULT_EDITOR_THEME,
    keyMap = DEFAULT_KEY_MAP,
    onClickReference,
    onCopyQuery,
    onEdit,
    readOnly = false,
  }: UseQueryEditorArgs = {},
  caller?: Function,
) {
  const { schema } = useSchemaContext({
    nonNull: true,
    caller: caller || useQueryEditor,
  });
  const {
    externalFragments,
    initialQuery,
    queryEditor,
    setOperationName,
    setQueryEditor,
    validationRules,
    variableEditor,
    updateActiveTabValues,
  } = useEditorContext({
    nonNull: true,
    caller: caller || useQueryEditor,
  });
  const executionContext = useExecutionContext();
  const storage = useStorageContext();
  const explorer = useExplorerContext();
  const plugin = usePluginContext();
  const copy = useCopyQuery({ caller: caller || useQueryEditor, onCopyQuery });
  const merge = useMergeQuery({ caller: caller || useQueryEditor });
  const prettify = usePrettifyEditors({ caller: caller || useQueryEditor });
  const ref = useRef<HTMLDivElement>(null);
  const { run } = executionContext!;

  useEffect(() => {
    setQueryEditor(createEditor('operations', ref.current!));
    OPERATIONS_MODEL.onDidChangeContent(
      debounce(100, () => {
        const value = OPERATIONS_MODEL.getValue();
        storage?.set(STORAGE_KEY_QUERY, value);
        updateActiveTabValues({
          query: value,
          operationName: /* operationFacts?.operationName ?? */ null,
        });
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  useEffect(() => {
    // add the runOperationAction to the operation and variables editors
    queryEditor?.addAction({
      id: 'graphql-run-operation',
      label: 'Run Operation',
      contextMenuOrder: 0,
      contextMenuGroupId: 'graphql',
      // eslint-disable-next-line no-bitwise
      keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
      run,
    });
  }, [queryEditor, run]);

  useEffect(() => {
    if (schema) {
      MONACO_GRAPHQL_API.setSchemaConfig([{ uri: 'schema.graphql', schema }]);
    }
  }, [schema]);

  const onClickReferenceRef = useRef<
    NonNullable<UseQueryEditorArgs['onClickReference']>
  >(() => {});
  useEffect(() => {
    onClickReferenceRef.current = reference => {
      if (!explorer || !plugin) {
        return;
      }
      plugin.setVisiblePlugin(DOC_EXPLORER_PLUGIN);
      switch (reference.kind) {
        case 'Type': {
          explorer.push({ name: reference.type.name, def: reference.type });
          break;
        }
        case 'Field': {
          explorer.push({ name: reference.field.name, def: reference.field });
          break;
        }
        case 'Argument': {
          if (reference.field) {
            explorer.push({ name: reference.field.name, def: reference.field });
          }
          break;
        }
        case 'EnumValue': {
          if (reference.type) {
            explorer.push({ name: reference.type.name, def: reference.type });
          }
          break;
        }
      }
      onClickReference?.(reference);
    };
  }, [explorer, onClickReference, plugin]);

  return ref;
}

export const STORAGE_KEY_QUERY = 'query';
