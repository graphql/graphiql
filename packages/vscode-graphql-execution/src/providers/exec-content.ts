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
import { loadConfig, GraphQLProjectConfig } from 'graphql-config';
import { visit, VariableDefinitionNode } from 'graphql';
import { NetworkHelper } from '../helpers/network';
import { SourceHelper, GraphQLScalarTSType } from '../helpers/source';
import {
  LanguageServiceExecutionExtension,
  EndpointsExtension,
} from '../helpers/extensions';

import type { Endpoint, Endpoints } from '../helpers/extensions';
import type { ExtractedTemplateLiteral } from '../helpers/source';

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
  private _projectConfig: GraphQLProjectConfig | undefined;

  // Event emitter which invokes document updates
  private _onDidChange = new EventEmitter<Uri>();

  private html = ''; // HTML document buffer

  timeout = (ms: number) => new Promise(res => setTimeout(res, ms));

  getCurrentHtml(): string {
    return this.html;
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
        [node.variable.name.value]: this.sourceHelper.typeCast(
          (await window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: `Please enter the value for ${node.variable.name.value}`,
            validateInput: (value: string) =>
              this.sourceHelper.validate(value, variableType),
          }))!,
          variableType,
        ),
      };
    }
    return variables;
  }

  async getEndpointName(endpointNames: string[]) {
    // Endpoints extensions docs say that at least "default" will be there
    let [endpointName] = endpointNames;
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

    // eslint-disable-next-line promise/prefer-await-to-then -- can't use async in constructor
    this.loadProvider().catch(err => {
      this.html = err.toString();
    });
  }

  validUrlFromSchema(pathOrUrl: string) {
    return /^https?:\/\//.test(pathOrUrl);
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

  async loadEndpoint(): Promise<Endpoint | null> {
    let endpoints: Endpoints = this._projectConfig?.extensions?.endpoints;

    if (!endpoints) {
      endpoints = {
        default: { url: '' },
      } as Endpoints;

      this.update(this.uri);
      this.updatePanel();
      if (this._projectConfig?.schema) {
        this.outputChannel.appendLine(
          "Warning: endpoints missing from graphql config. will try 'schema' value(s) instead",
        );
        const { schema } = this._projectConfig;
        if (schema && Array.isArray(schema)) {
          for (const s of schema) {
            if (this.validUrlFromSchema(s as string)) {
              endpoints.default.url = s.toString();
            }
          }
        } else if (schema && this.validUrlFromSchema(schema as string)) {
          endpoints.default.url = schema.toString();
        }
      } else if (endpoints?.default?.url) {
        this.outputChannel.appendLine(
          `Warning: No Endpoints configured. Attempting to execute operation with 'config.schema' value '${endpoints.default.url}'`,
        );
      } else {
        this.reportError(
          'Warning: No Endpoints configured. Config schema contains no URLs',
        );
        return null;
      }
    }
    const endpointNames = Object.keys(endpoints);

    if (endpointNames.length === 0) {
      this.reportError(
        'Error: endpoint data missing from graphql config endpoints extension',
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
      }

      await this.loadConfig();
      const projectConfig = this._projectConfig;

      if (!projectConfig) {
        return;
      }

      const endpoint = await this.loadEndpoint();
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
        this.reportError('Error: no endpoint url provided');
        return;
      }
    } catch (err: unknown) {
      // @ts-expect-error
      this.reportError(`Error: graphql operation failed\n ${err.toString()}`);
      return;
    }
  }

  async loadConfig() {
    const { rootDir, literal } = this;
    if (!rootDir) {
      this.reportError('Error: this file is outside the workspace.');
      return;
    }

    const config = await loadConfig({
      rootDir: rootDir.uri.fsPath,
      throwOnEmpty: false,
      throwOnMissing: false,
      legacy: true,
      extensions: [LanguageServiceExecutionExtension, EndpointsExtension],
    });
    this._projectConfig = config?.getProjectForFile(literal.uri);

    // eslint-disable-next-line unicorn/consistent-destructuring
    if (!this._projectConfig?.schema) {
      this.reportError('Error: schema from graphql config');
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
