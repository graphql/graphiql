import {
  OutputChannel,
  TextDocumentContentProvider,
  EventEmitter,
  Uri,
  Event,
  ProviderResult,
  window,
  WebviewPanel,
} from 'vscode';
import { visit, VariableDefinitionNode, DocumentNode } from 'graphql';
import { NetworkHelper } from '../helpers/network';
import { SourceHelper, GraphQLScalarTSType } from '../helpers/source';

import type { ExtractedTemplateLiteral } from '../helpers/source';
import { ConfigHelper } from '../helpers/config';

export type UserVariables = { [key: string]: GraphQLScalarTSType };

// TODO: remove residue of previewHtml API https://github.com/microsoft/vscode/issues/62630
// We update the panel directly now in place of a event based update API (we might make a custom event updater and remove panel dep though)
export class GraphQLContentProvider implements TextDocumentContentProvider {
  private networkHelper: NetworkHelper;
  private sourceHelper: SourceHelper;

  constructor(
    private uri: Uri,
    private outputChannel: OutputChannel,
    private literal: ExtractedTemplateLiteral,
    private panel: WebviewPanel,
    private configHelper: ConfigHelper,
  ) {
    this.sourceHelper = new SourceHelper(this.outputChannel);
    this.networkHelper = new NetworkHelper(
      this.outputChannel,
      this.sourceHelper,
    );
    this.panel = panel;
    if (this.panel) {
      this.panel.webview.options = {
        enableScripts: true,
      };
    }
  }

  // Event emitter which invokes document updates
  private _onDidChange = new EventEmitter<Uri>();

  private html = ''; // HTML document buffer

  timeout = (ms: number) => new Promise(res => setTimeout(res, ms));

  getCurrentHtml(): string {
    return this.html;
  }

  updatePanel() {
    if (this.panel) {
      this.panel.webview.html = this.html;
    }
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
  private collectVariableDefinitions(ast: DocumentNode) {
    const variableDefinitionNodes: VariableDefinitionNode[] = [];
    visit(ast, {
      VariableDefinition(node: VariableDefinitionNode) {
        variableDefinitionNodes.push(node);
      },
    });
    return variableDefinitionNodes;
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

  async loadProvider() {
    try {
      // run to clear any previous results or errors
      this.update(this.uri);
      this.updatePanel();
      const projectConfig = await this.configHelper.loadConfig(
        this.literal.uri,
      );
      const endpoint = await this.configHelper.loadEndpoint(this.literal.uri);
      if (endpoint?.url) {
        const variableDefinitionNodes = this.collectVariableDefinitions(
          this.literal.ast,
        );

        const updateCallback = (data: string, operation: string) => {
          let html = '';
          if (operation === 'subscription') {
            html = `<pre>${data}</pre>`;
          } else {
            html += `<pre>${data}</pre>`;
          }
          this.setContentAndUpdate(html);
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
      this.reportError(err.toString());
      return;
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
