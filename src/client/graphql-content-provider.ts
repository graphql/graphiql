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
} from "vscode"

import type { ExtractedTemplateLiteral } from "./source-helper"
import { loadConfig, GraphQLProjectConfig } from "graphql-config"
import { visit, VariableDefinitionNode } from "graphql"
import { NetworkHelper, Endpoint } from "./network-helper"
import { SourceHelper, GraphQLScalarTSType } from "./source-helper"
import type { Endpoints } from "graphql-config/extensions/endpoints"

export type UserVariables = { [key: string]: GraphQLScalarTSType }

// TODO: remove residue of previewHtml API https://github.com/microsoft/vscode/issues/62630
// We update the panel directly now in place of a event based update API (we might make a custom event updater and remove panel dep though)
export class GraphQLContentProvider implements TextDocumentContentProvider {
  private uri: Uri
  private outputChannel: OutputChannel
  private networkHelper: NetworkHelper
  private sourceHelper: SourceHelper
  private panel: WebviewPanel
  private rootDir: WorkspaceFolder | undefined
  private literal: ExtractedTemplateLiteral

  // Event emitter which invokes document updates
  private _onDidChange = new EventEmitter<Uri>()

  private html: string = "" // HTML document buffer

  timeout = ms => new Promise(res => setTimeout(res, ms))

  getCurrentHtml(): Promise<string> {
    return new Promise(resolve => {
      resolve(this.html)
    })
  }

  updatePanel() {
    this.panel.webview.html = this.html
  }

  async getVariablesFromUser(
    variableDefinitionNodes: VariableDefinitionNode[],
  ): Promise<UserVariables> {
    await this.timeout(500)
    let variables = {}
    for (let node of variableDefinitionNodes) {
      const variableType = this.sourceHelper.getTypeForVariableDefinitionNode(
        node,
      )
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
      }
    }
    return variables
  }

  async getEndpointName(endpointNames: string[]) {
    // Endpoints extensions docs say that at least "default" will be there
    let endpointName = endpointNames[0]
    if (endpointNames.length > 1) {
      const pickedValue = await window.showQuickPick(endpointNames, {
        canPickMany: false,
        ignoreFocusOut: true,
        placeHolder: "Select an endpoint",
      })

      if (pickedValue) {
        endpointName = pickedValue
      }
    }
    return endpointName
  }

  constructor(
    uri: Uri,
    outputChannel: OutputChannel,
    literal: ExtractedTemplateLiteral,
    panel: WebviewPanel,
  ) {
    this.uri = uri
    this.outputChannel = outputChannel
    this.sourceHelper = new SourceHelper(this.outputChannel)
    this.networkHelper = new NetworkHelper(
      this.outputChannel,
      this.sourceHelper,
    )
    this.panel = panel
    this.rootDir = workspace.getWorkspaceFolder(Uri.file(literal.uri))
    this.literal = literal
    this.panel.webview.options = {
      enableScripts: true,
    }

    this.loadProvider()
      .then()
      .catch(err => {
        this.html = err.toString()
      })
  }
  validUrlFromSchema(pathOrUrl: string) {
    return Boolean(pathOrUrl.match(/^https?:\/\//g))
  }
  async loadEndpoint(
    projectConfig?: GraphQLProjectConfig,
  ): Promise<Endpoint | null> {
    // I dont think this is needed in 3.0 any more.
    // if (config && !projectConfig) {
    //   projectConfig = this.patchProjectConfig(config) as GraphQLProjectConfig
    // }
    let endpoints: Endpoints = projectConfig?.extensions?.endpoints

    if (!endpoints) {
      endpoints = {
        default: { url: "" },
      } as Endpoints

      this.update(this.uri)
      this.updatePanel()
      if (projectConfig?.schema) {
        this.outputChannel.appendLine(
          `Warning: endpoints missing from graphql config. will try 'schema' value(s) instead`,
        )
        const schema = projectConfig.schema
        if (schema && Array.isArray(schema)) {
          schema.map(s => {
            if (this.validUrlFromSchema(s as string)) {
              endpoints!.default.url = s.toString()
            }
          })
        } else if (schema && this.validUrlFromSchema(schema as string)) {
          endpoints.default.url = schema.toString()
        }
      }
      if (!endpoints?.default?.url) {
        this.html =
          "Warning: No Endpoints configured. Config schema contains no URLs"
        this.update(this.uri)
        this.updatePanel()
        return null
      } else {
        this.outputChannel.appendLine(
          `Warning: No Endpoints configured. Attempting to execute operation with 'config.schema' value '${endpoints.default.url}'`,
        )
      }
    }
    const endpointNames = Object.keys(endpoints)

    if (endpointNames.length === 0) {
      this.outputChannel.appendLine(
        `Error: endpoint data missing from graphql config endpoints extension`,
      )
      this.html =
        "Error: endpoint data missing from graphql config endpoints extension"
      this.update(this.uri)
      this.updatePanel()
      return null
    }
    const endpointName = await this.getEndpointName(endpointNames)
    return endpoints[endpointName] || endpoints.default
  }
  async loadProvider() {
    try {
      const rootDir = workspace.getWorkspaceFolder(Uri.file(this.literal.uri))
      if (!rootDir) {
        this.outputChannel.appendLine(
          `Error: this file is outside the workspace.`,
        )
        this.html = "Error: this file is outside the workspace."
        this.update(this.uri)
        this.updatePanel()
        return
      } else {
        const config = await loadConfig({ rootDir: rootDir!.uri.fsPath })
        let projectConfig = config?.getProjectForFile(this.literal.uri)
        if (!projectConfig) {
          return
        }

        const endpoint = await this.loadEndpoint(projectConfig)
        if (endpoint) {
          let variableDefinitionNodes: VariableDefinitionNode[] = []
          visit(this.literal.ast, {
            VariableDefinition(node: VariableDefinitionNode) {
              variableDefinitionNodes.push(node)
            },
          })

          const updateCallback = (data: string, operation: string) => {
            if (operation === "subscription") {
              this.html = `<pre>${data}</pre>` + this.html
            } else {
              this.html += `<pre>${data}</pre>`
            }
            this.update(this.uri)
            this.updatePanel()
          }

          if (variableDefinitionNodes.length > 0) {
            const variables = await this.getVariablesFromUser(
              variableDefinitionNodes,
            )

            await this.networkHelper.executeOperation({
              endpoint,
              literal: this.literal,
              variables,
              updateCallback,
              projectConfig,
            })
          } else {
            await this.networkHelper.executeOperation({
              endpoint,
              literal: this.literal,
              variables: {},
              updateCallback,
              projectConfig,
            })
          }
        }
      }
    } catch (err) {
      if (err.networkError) {
        this.html += err.networkError
      }

      throw err
    }
  }
  async loadConfig() {
    const rootDir = this.rootDir
    if (!rootDir) {
      this.outputChannel.appendLine(
        `Error: this file is outside the workspace.`,
      )
      this.html = "Error: this file is outside the workspace."
      this.update(this.uri)
      this.updatePanel()
      return
    } else {
      const config = await loadConfig({ rootDir: rootDir!.uri.fsPath })
      let projectConfig = config?.getProjectForFile(this.literal.uri)

      if (!projectConfig!.schema) {
        this.outputChannel.appendLine(`Error: schema from graphql config`)
        this.html = "Error: schema missing from graphql config"
        this.update(this.uri)
        this.updatePanel()
        return
      }
      return projectConfig
    }
  }

  get onDidChange(): Event<Uri> {
    return this._onDidChange.event
  }

  public update(uri: Uri) {
    this._onDidChange.fire(uri)
  }

  provideTextDocumentContent(_: Uri): ProviderResult<string> {
    return this.html
  }
}
