import {
  workspace,
  OutputChannel,
  TextDocumentContentProvider,
  EventEmitter,
  Uri,
  Event,
  ProviderResult,
  window,
  WebviewPanel,
  WorkspaceFolder,
} from 'vscode';
import type { ExtractedTemplateLiteral } from '../helpers/source';
import { loadConfig, GraphQLProjectConfig } from 'graphql-config';
import { visit, VariableDefinitionNode } from 'graphql';
import { NetworkHelper } from '../helpers/network';
import { SourceHelper, GraphQLScalarTSType } from '../helpers/source';

import type {
  Endpoints,
  Endpoint,
  // @ts-expect-error
} from 'graphql-config/cjs/extensions/endpoints';

export type UserVariables = { [key: string]: GraphQLScalarTSType };

// TODO: remove residue of previewHtml API https://github.com/microsoft/vscode/issues/62630
// We update the panel directly now in place of a event based update API (we might make a custom event updater and remove panel dep though)
export class GraphQLContentProvider implements TextDocumentContentProvider {
  private uri: Uri;
  private outputChannel: OutputChannel;
  private networkHelper: NetworkHelper;
  private sourceHelper: SourceHelper;
  private panel: WebviewPanel;
  private rootDir: WorkspaceFolder | undefined;
  private literal: ExtractedTemplateLiteral;

  // Event emitter which invokes document updates
  private _onDidChange = new EventEmitter<Uri>();

  private html = ''; // HTML document buffer

  timeout = (ms: number) => new Promise(res => setTimeout(res, ms));

  getCurrentHtml(): Promise<string> {
    return new Promise(resolve => {
      resolve(this.html);
    });
  }

  updatePanel() {
    this.panel.webview.html = this.html;
  }

  async getVariablesFromUser(
    variableDefinitionNodes: VariableDefinitionNode[],
  ): Promise<UserVariables> {
    await this.timeout(500);
    let variables = {};
    for await (const node of variableDefinitionNodes) {
      const variableType =
        this.sourceHelper.getTypeForVariableDefinitionNode(node);
      variables = {
        ...variables,
        [`${node.variable.name.value}`]: this.sourceHelper.typeCast(
          (await window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: `Please enter the value for ${node.variable.name.value}`,
            validateInput: async (value: string) =>
              this.sourceHelper.validate(value, variableType),
          })) as string,
          variableType,
        ),
      };
    }
    return variables;
  }

  async getEndpointName(endpointNames: string[]) {
    // Endpoints extensions docs say that at least "default" will be there
    let endpointName = endpointNames[0];
    if (endpointNames.length > 1) {
      const pickedValue = await window.showQuickPick(endpointNames, {
        canPickMany: false,
        ignoreFocusOut: true,
        placeHolder: 'Select an endpoint',
      });

      if (pickedValue) {
        endpointName = pickedValue;
      }
    }
    return endpointName;
  }

  constructor(
    uri: Uri,
    outputChannel: OutputChannel,
    literal: ExtractedTemplateLiteral,
    panel: WebviewPanel,
  ) {
    this.uri = uri;
    this.outputChannel = outputChannel;
    this.sourceHelper = new SourceHelper(this.outputChannel);
    this.networkHelper = new NetworkHelper(
      this.outputChannel,
      this.sourceHelper,
    );
    this.panel = panel;
    this.rootDir = workspace.getWorkspaceFolder(Uri.file(literal.uri));
    this.literal = literal;
    this.panel.webview.options = {
      enableScripts: true,
    };

    this.loadProvider()
      .then()
      .catch(err => {
        this.html = err.toString();
      });
  }
  validUrlFromSchema(pathOrUrl: string) {
    return Boolean(pathOrUrl.match(/^https?:\/\//g));
  }
  reportError(message: string) {
    this.outputChannel.appendLine(message);
    this.setContentAndUpdate(message);
  }
  setContentAndUpdate(html: string) {
    this.html = html;
    this.update(this.uri);
    this.updatePanel();
  }
  async loadEndpoint(
    projectConfig?: GraphQLProjectConfig,
  ): Promise<Endpoint | null> {
    let endpoints: Endpoints = projectConfig?.extensions?.endpoints;

    if (!endpoints) {
      endpoints = {
        default: { url: '' },
      } as Endpoints;

      this.update(this.uri);
      this.updatePanel();
      if (projectConfig?.schema) {
        this.outputChannel.appendLine(
          `Warning: endpoints missing from graphql config. will try 'schema' value(s) instead`,
        );
        const schema = projectConfig.schema;
        if (schema && Array.isArray(schema)) {
          schema.map(s => {
            if (this.validUrlFromSchema(s as string)) {
              endpoints!.default.url = s.toString();
            }
          });
        } else if (schema && this.validUrlFromSchema(schema as string)) {
          endpoints.default.url = schema.toString();
        }
      } else if (!endpoints?.default?.url) {
        this.reportError(
          'Warning: No Endpoints configured. Config schema contains no URLs',
        );
        return null;
      } else {
        this.outputChannel.appendLine(
          `Warning: No Endpoints configured. Attempting to execute operation with 'config.schema' value '${endpoints.default.url}'`,
        );
      }
    }
    const endpointNames = Object.keys(endpoints);

    if (endpointNames.length === 0) {
      this.reportError(
        `Error: endpoint data missing from graphql config endpoints extension`,
      );
      return null;
    }
    const endpointName = await this.getEndpointName(endpointNames);
    return endpoints[endpointName] || endpoints.default;
  }
  async loadProvider() {
    try {
      const rootDir = workspace.getWorkspaceFolder(Uri.file(this.literal.uri));
      if (!rootDir) {
        this.reportError('Error: this file is outside the workspace.');
        return;
      } else {
        const config = await loadConfig({
          rootDir: rootDir!.uri.fsPath,
          legacy: true,
        });
        const projectConfig = config?.getProjectForFile(this.literal.uri);
        if (!projectConfig) {
          return;
        }

        const endpoint = await this.loadEndpoint(projectConfig);
        if (endpoint?.url) {
          const variableDefinitionNodes: VariableDefinitionNode[] = [];
          visit(this.literal.ast, {
            VariableDefinition(node: VariableDefinitionNode) {
              variableDefinitionNodes.push(node);
            },
          });

          const updateCallback = (data: string, operation: string) => {
            if (operation === 'subscription') {
              this.html = `<pre>${data}</pre>` + this.html;
            } else {
              this.html += `<pre>${data}</pre>`;
            }
            this.update(this.uri);
            this.updatePanel();
          };

          if (variableDefinitionNodes.length > 0) {
            const variables = await this.getVariablesFromUser(
              variableDefinitionNodes,
            );

            await this.networkHelper.executeOperation({
              endpoint,
              literal: this.literal,
              variables,
              updateCallback,
              projectConfig,
            });
          } else {
            await this.networkHelper.executeOperation({
              endpoint,
              literal: this.literal,
              variables: {},
              updateCallback,
              projectConfig,
            });
          }
        } else {
          this.reportError(`Error: no endpoint url provided`);
          return;
        }
      }
    } catch (err: unknown) {
      // @ts-expect-error
      this.reportError(`Error: graphql operation failed\n ${err.toString()}`);
      return;
    }
  }
  async loadConfig() {
    const rootDir = this.rootDir;
    if (!rootDir) {
      this.reportError(`Error: this file is outside the workspace.`);
      return;
    } else {
      const config = await loadConfig({ rootDir: rootDir!.uri.fsPath });
      const projectConfig = config?.getProjectForFile(this.literal.uri);

      if (!projectConfig!.schema) {
        this.reportError(`Error: schema from graphql config`);
        return;
      }
      return projectConfig;
    }
  }

  get onDidChange(): Event<Uri> {
    return this._onDidChange.event;
  }

  public update(uri: Uri) {
    this._onDidChange.fire(uri);
  }

  provideTextDocumentContent(_: Uri): ProviderResult<string> {
    return this.html;
  }
}
