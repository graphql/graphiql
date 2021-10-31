/* global netlify */

import * as monaco from 'monaco-editor';

import { init } from 'monaco-graphql';

import { JSONSchema6 } from 'json-schema';

import { getOperationFacts } from 'graphql-language-service';

// NOTE: using loader syntax becuase Yaml worker imports editor.worker directly and that
// import shouldn't go through loader syntax.
// @ts-ignore
import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';
// @ts-ignore
import JSONWorker from 'worker-loader!monaco-editor/esm/vs/language/json/json.worker';
// @ts-ignore
import GraphQLWorker from 'worker-loader!monaco-graphql/esm/graphql.worker';
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from 'graphql';
import { JSONSchema6TypeName } from 'json-schema';
import { LanguageServiceAPI } from 'monaco-graphql/src/api';

const SCHEMA_URL = 'https://api.github.com/graphql';

const SITE_ID = '46a6b3c8-992f-4623-9a76-f1bd5d40505c';
let API_TOKEN = localStorage.getItem('ghapi') || null;

let isLoggedIn = false;

// @ts-ignore
window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'graphqlDev') {
      return new GraphQLWorker();
    }
    if (label === 'json') {
      return new JSONWorker();
    }
    return new EditorWorker();
  },
};

const operationString = `
# right click to view context menu
# F1 for command palette
# enjoy prettier formatting, autocompletion, 
# validation, hinting and more for GraphQL SDL and operations!

query Example($owner: String!, $name: String!, $review: PullRequestReviewEvent!, $user: FollowUserInput) {
  repository(owner: $owner, name: $name) {
    stargazerCount
  }
}
`;

const variablesString = `{ 
  "review": "graphql", 
  "name": true
}`;

const THEME = 'vs-dark';

/**
 * load local schema by default
 */
(async () => {
  const api = await init({
    schemaConfig: {
      uri: SCHEMA_URL,
      requestOpts: {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      },
    },
  });
  await render(api);
})();

async function render(api: LanguageServiceAPI) {
  const toolbar = document.getElementById('toolbar');
  if (!isLoggedIn && !API_TOKEN) {
    const githubButton = document.createElement('button');

    githubButton.id = 'login';
    githubButton.innerHTML = 'GitHub Login for <pre>monaco-graphql</pre> Demo';

    githubButton.onclick = e => {
      e.preventDefault();
      // @ts-ignore
      const authenticator = new netlify.default({ site_id: SITE_ID });
      authenticator.authenticate(
        { provider: 'github', scope: ['user', 'read:org'] },
        (err: Error, data: { token: string }) => {
          if (err) {
            console.error('Error Authenticating with GitHub: ' + err);
          } else {
            isLoggedIn = true;
            API_TOKEN = data.token;
            localStorage.setItem('ghapi', data.token);
            render(api);
          }
        },
      );
    };
    toolbar?.appendChild(githubButton);
    return;
  } else {
    if (toolbar) {
      const button = document.createElement('button');

      button.id = 'button';
      button.innerText = 'Run Operation ➤';

      button.onclick = () => executeCurrentOp();
      button.ontouchend = () => executeCurrentOp();
      toolbar.innerHTML = '';
      toolbar?.appendChild(button);
    }
  }

  /**
   * Creating & configuring the monaco editor panes
   */

  const variablesModel = monaco.editor.createModel(
    variablesString,
    'json',
    monaco.Uri.file('/1/variables.json'),
  );

  const variablesSchemaUri = monaco.Uri.file('/1/variables-schema.json');
  /**
   * Variables json schema model
   */

  const variablesSchemaModel = monaco.editor.createModel(
    variablesString,
    'json',
    variablesSchemaUri,
  );

  const resultsEditor = monaco.editor.create(
    document.getElementById('results') as HTMLElement,
    {
      value: `{}`,
      language: 'json',
      automaticLayout: true,
      theme: THEME,
      wordWrap: 'on',
    },
  );

  const variablesEditor = monaco.editor.create(
    document.getElementById('variables') as HTMLElement,
    {
      model: variablesModel,
      language: 'json',
      automaticLayout: true,
      formatOnPaste: true,
      formatOnType: true,
      theme: THEME,
    },
  );

  // monaco.languages.json.jsonDefaults.setModeConfiguration({
  //   diagnostics: true,
  //   completionItems: true,
  //   hovers: true
  // });

  const operationModel = monaco.editor.createModel(
    operationString,
    'graphqlDev',
    monaco.Uri.file('/1/operation.graphql'),
  );

  const operationEditor = monaco.editor.create(
    document.getElementById('operation') as HTMLElement,
    {
      model: operationModel,
      automaticLayout: true,
      formatOnPaste: true,
      formatOnType: true,
      folding: true,
      theme: THEME,
      language: 'graphqlDev',
    },
  );

  const scalarTypesMap: { [key: string]: JSONSchema6TypeName } = {
    Int: 'integer',
    String: 'string',
    Float: 'number',
    ID: 'string',
    Boolean: 'boolean',
  };

  const scalarType = (definition: JSONSchema6, type: GraphQLScalarType) => {
    definition.type = scalarTypesMap[type.name];
  };

  const listType = (definition: JSONSchema6, type: GraphQLList<any>) => {
    definition.type = 'array';
    definition.items = { type: scalarTypesMap[type.ofType] || type.ofType };
  };
  const enumType = (definition: JSONSchema6, type: GraphQLEnumType) => {
    definition.type = 'string';
    definition.enum = type.getValues().map(val => val.name);
  };

  const objectType = (
    definition: JSONSchema6,
    type: GraphQLObjectType | GraphQLInterfaceType | GraphQLInputObjectType,
  ) => {
    definition.type = 'object';
    const fields = type.getFields();
    if (!definition.properties) {
      definition.properties = {};
    }
    definition.required = [];

    Object.keys(fields).forEach((fieldName: string) => {
      const {
        required,
        definition: fieldDefinition,
      } = getJSONSchemaFromGraphQLType(
        fields[fieldName].type as GraphQLInputType,
      );
      definition.properties![fieldName] = fieldDefinition;
      if (required) {
        definition.required?.push(fieldName);
      }
    });
  };

  function getJSONSchemaFromGraphQLType(
    type: GraphQLInputType,
  ): { definition: JSONSchema6; required: boolean } {
    let required = false;
    let definition: JSONSchema6 = {};
    if ('description' in type) {
      definition.description = type.description as string;
    }
    if (isEnumType(type)) {
      enumType(definition, type);
    }
    if (
      isInterfaceType(type) ||
      isObjectType(type) ||
      isInputObjectType(type)
    ) {
      objectType(definition, type);
    }
    if (isListType(type)) {
      listType(definition, type);
    }
    if (isScalarType(type)) {
      scalarType(definition, type);
    }
    if (isNonNullType(type)) {
      required = true;
      definition = getJSONSchemaFromGraphQLType(type.ofType).definition;
    }

    return { required, definition };
  }

  const getJSONSchema = (schema: GraphQLSchema) => {
    const doc = operationModel.getValue();
    const facts = getOperationFacts(schema, doc);
    const jsonSchema: JSONSchema6 = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'monaco://variables-schema.json',
      title: 'GraphQL Variables',
      type: 'object',
      properties: {},
      required: [],
    };

    if (facts && facts.variableToType) {
      Object.entries(facts.variableToType).forEach(([variableName, type]) => {
        // @ts-ignore
        const { definition, required } = getJSONSchemaFromGraphQLType(type);
        jsonSchema.properties![variableName] = definition;
        if (required) {
          jsonSchema.required?.push(variableName);
        }
      });
    }
    return jsonSchema;
  };

  const updateVariables = async () => {
    const schema = await api.getSchema();
    if (schema) {
      const jsonSchema = getJSONSchema(schema.schema);
      variablesSchemaModel.setValue(JSON.stringify(jsonSchema));
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemaValidation: 'error',
        schemas: [
          {
            uri: variablesSchemaUri.toString(),
            fileMatch: [variablesModel.uri.toString()],
            schema: jsonSchema,
          },
        ],
      });
    }
  };

  await updateVariables();

  operationEditor.onDidChangeModelContent(async _event => {
    await updateVariables();
  });

  /**
   * Configure monaco-graphql formatting operations
   */

  api.setFormattingOptions({
    prettierConfig: {
      printWidth: 120,
    },
  });

  /**
   * Basic Operation Exec Example
   */

  async function executeCurrentOp() {
    try {
      const operation = operationEditor.getValue();
      const variables = variablesEditor.getValue();
      const body: { variables?: string; query: string } = { query: operation };
      // parse the variables so we can detect if we need to send any
      const parsedVariables = JSON.parse(variables);
      if (parsedVariables && Object.keys(parsedVariables).length) {
        body.variables = variables;
      }
      const result = await fetch(api.schemaConfig.uri || SCHEMA_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      const resultText = await result.text();
      resultsEditor.setValue(JSON.stringify(JSON.parse(resultText), null, 2));
    } catch (err) {
      // set the error to results
      // @ts-ignore
      resultsEditor.setValue(err.toString());
    }
  }

  const opAction: monaco.editor.IActionDescriptor = {
    id: 'graphql-run',
    label: 'Run Operation',
    contextMenuOrder: 0,
    contextMenuGroupId: 'operation',
    keybindings: [
      // eslint-disable-next-line no-bitwise
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
    ],
    run: executeCurrentOp,
  };

  operationEditor.addAction(opAction);
  variablesEditor.addAction(opAction);
  resultsEditor.addAction(opAction);

  // if (!initialSchema) {
  //   GraphQLAPI.setSchemaConfig({
  //     uri: SCHEMA_URL,
  //     requestOpts: {
  //       headers: {
  //         Authorization: `Bearer ${API_TOKEN}`,
  //       },
  //     },
  //   });
  //   initialSchema = true;
  // }
  // add your own diagnostics? why not!
  // monaco.editor.setModelMarkers(
  //   model,
  //   'graphql',
  //   [{
  //     severity: 5,
  //     message: 'An example diagnostic error',
  //     startColumn: 2,
  //     startLineNumber: 4,
  //     endLineNumber: 4,
  //     endColumn: 0,
  //   }],
  // );
}
