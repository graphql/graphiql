<template>
  <div id="wrapper">
    <div id="left-pane" class="pane">
      <div ref="opsRef" class="editor"></div>
      <div ref="varsRef" class="editor"></div>
    </div>
    <div id="right-pane" class="pane">
      <div ref="resultsRef" class="editor"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import { Uri, editor, KeyMod, KeyCode, languages } from 'monaco-editor';
import { initializeMode } from 'monaco-graphql/src/initializeMode';
import { createGraphiQLFetcher, type SyncExecutionResult } from '@graphiql/toolkit';
import * as JSONC from 'jsonc-parser';
import { debounce } from './debounce';
import { defineComponent, ref, type Ref, unref, watch, onMounted } from 'vue'

const fetcher = createGraphiQLFetcher({
  url: 'https://api.spacex.land/graphql/',
});

const defaultOperations =
  localStorage.getItem('operations') ??
  `
# cmd/ctrl + return/enter will execute the op,
# same in variables editor below
# also available via context menu & f1 command palette

query($limit: Int!) {
    payloads(limit: $limit) {
        customer
    }
}
`;

const defaultVariables =
  localStorage.getItem('variables') ??
  `
 {
     // limit will appear here as autocomplete,
     // and because the default value is 0, will
     // complete as such
     $1
 }
`;

const getSchema = async () =>
  fetcher({
    query: getIntrospectionQuery(),
    operationName: 'IntrospectionQuery',
  });

const getOrCreateModel = (uri: string, value: string) => {
  return (
    editor.getModel(Uri.file(uri)) ??
    editor.createModel(value, uri.split('.').pop(), Uri.file(uri))
  );
};

const execOperation = async function () {
  const variables = editor.getModel(Uri.file('variables.json'))!.getValue();
  const operations = editor.getModel(Uri.file('operation.graphql'))!.getValue();
  const resultsModel = editor.getModel(Uri.file('results.json'));
  // @ts-expect-error
  const result = await fetcher({
    query: operations,
    variables: JSON.stringify(JSONC.parse(variables)),
  });
  // TODO: this demo only supports a single iteration for http GET/POST,
  // no multipart or subscriptions yet.
  // @ts-expect-error
  const data = await result.next();

  resultsModel?.setValue(JSON.stringify(data.value, null, 2));
};

const queryAction = {
  id: 'graphql-run',
  label: 'Run Operation',
  contextMenuOrder: 0,
  contextMenuGroupId: 'graphql',
  keybindings: [
    // eslint-disable-next-line no-bitwise
    KeyMod.CtrlCmd | KeyCode.Enter,
  ],
  run: execOperation,
};
// set these early on so that initial variables with comments don't flash an error
languages.json.jsonDefaults.setDiagnosticsOptions({
  allowComments: true,
  trailingCommas: 'ignore',
});

const createEditor = (
  ref: Ref<any | null>,
  options: editor.IStandaloneEditorConstructionOptions,
) => editor.create(unref(ref) as HTMLElement, options);

export default defineComponent({
  setup() {
    const opsRef = ref(null);
    const varsRef = ref(null);
    const resultsRef = ref(null);

    const loading = ref(false);
    const schema = ref<IntrospectionQuery | null>(null);

    const queryEditor = ref<editor.IStandaloneCodeEditor | null>(null)
    const variablesEditor = ref<editor.IStandaloneCodeEditor | null>(null)
    const resultsViewer = ref<editor.IStandaloneCodeEditor | null>(null)

    const queryModel = getOrCreateModel('operation.graphql', defaultOperations);
    const variablesModel = getOrCreateModel('variables.json', defaultVariables);
    const resultsModel = getOrCreateModel('results.json', '{}');

    function setQueryEditor(editor: editor.IStandaloneCodeEditor) {
      queryEditor.value = editor;
      editor.onDidChangeModelContent(
        debounce(300,
          () => {
            localStorage.setItem('operations', editor.getValue());
            execOperation();
          }
        )
      );
    }

    function setVariablesEditor(editor: editor.IStandaloneCodeEditor) {
      variablesEditor.value = editor;
      editor.onDidChangeModelContent(
        debounce(300,
          () => {
            localStorage.setItem('variables', editor.getValue());
            execOperation();
          }
        )
      );
    }

    function setResultsViewer(editor: editor.IStandaloneCodeEditor) {
      resultsViewer.value = editor;
    }

    watch(opsRef, (newval) => {

      setQueryEditor(
        createEditor(opsRef, {
          theme: 'vs-dark',
          model: queryModel,
          language: 'graphql',
        }));
    })


    watch(varsRef, (newval) => {

      setVariablesEditor(
        createEditor(varsRef, {
          theme: 'vs-dark',
          model: variablesModel,
        }))
    })


    watch(resultsRef, (newval) => {

      setResultsViewer(
        createEditor(resultsRef, {
          theme: 'vs-dark',
          model: resultsModel,
          readOnly: true,
          smoothScrolling: true,
        })
      )
    })



    watch(queryEditor, () => {
      queryEditor?.value?.addAction(queryAction);
      variablesEditor?.value?.addAction(queryAction);
    })

    onMounted(async () => {
      if (!schema.value && !loading.value) {
        loading.value = true;
        const newSchema: SyncExecutionResult = await getSchema();
        if (!('data' in newSchema)) {
          throw Error(
            'this demo does not support subscriptions or http multipart yet',
          );
        }
        const introspectionQuery = (newSchema.data as unknown) as IntrospectionQuery;
        initializeMode({
          diagnosticSettings: {
            validateVariablesJSON: {
              [Uri.file('operation.graphql').toString()]: [
                Uri.file('variables.json').toString(),
              ],
            },
            jsonDiagnosticSettings: {
              validate: true,
              schemaValidation: 'error',
              // set these again, because we are entirely re-setting them here
              allowComments: true,
              trailingCommas: 'ignore',
            },
          },
          schemas: [
            {
              introspectionJSON: introspectionQuery,
              uri: 'myschema.graphql',
            },
          ],
        });

        schema.value = introspectionQuery;

        return;
      }
      loading.value = false;
    })

    return {
      opsRef,
      varsRef,
      resultsRef,
    }
  }
})

</script>

<style>
body {
  margin: 0;
  background-color: #1e1e1e;
  height: 100vh;
}

#wrapper {
  display: flex;
  flex-direction: row;
  height: 97.7vh;
}

.pane {
  height: 100%;
  width: 50%;
  display: flex;
  flex-direction: column;
  align-self: stretch;
}

#left-pane .editor {
  height: 50%;
}

#right-pane .editor {
  height: 100%;
}
</style>
