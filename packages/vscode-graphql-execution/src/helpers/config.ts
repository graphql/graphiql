import { loadConfig } from 'graphql-config';
import { OutputChannel, Uri, workspace, window } from 'vscode';
import {
  Endpoints,
  EndpointsExtension,
  LanguageServiceExecutionExtension,
} from './extensions';

export class ConfigHelper {
  constructor(private outputChannel: OutputChannel) {}
  private getRootDir(uri: string) {
    return workspace.getWorkspaceFolder(Uri.file(uri));
  }
  public async loadConfig(uri: string) {
    const rootDir = this.getRootDir(uri);
    if (!rootDir) {
      throw new Error('Error: this file is outside the workspace.');
    }
    const config = await loadConfig({
      rootDir: rootDir.uri.fsPath,
      throwOnEmpty: false,
      throwOnMissing: false,
      extensions: [LanguageServiceExecutionExtension, EndpointsExtension],
    });
    const projectConfig = config?.getProjectForFile(uri);

    if (!projectConfig?.schema) {
      throw new Error('Error: schema from graphql config');
    }
    console.log(projectConfig.schema);
    return projectConfig;
  }
  public async loadEndpoint(uri: string) {
    const project = await this.loadConfig(uri);
    const endpoints: Endpoints = project?.extensions?.endpoints;
    let schemaEndpoint: null | string = null;
    if (endpoints) {
      const endpointNames = Object.keys(endpoints);
      if (endpointNames.length === 0) {
        throw new Error(
          'Error: endpoint data missing from graphql config endpoints extension',
        );
      }
      const endpointName = await this.getEndpointName(endpointNames);
      return endpoints[endpointName] ?? endpoints?.default;
    }
    if (project?.schema) {
      this.outputChannel.appendLine(
        "Warning: endpoints missing from graphql config. will try 'schema' value(s) instead",
      );
      const { schema } = project;
      if (schema && Array.isArray(schema)) {
        for (const s of schema) {
          if (this.validUrlFromSchema(s as string)) {
            schemaEndpoint = s.toString();
          }
        }
      } else if (schema && this.validUrlFromSchema(schema as string)) {
        schemaEndpoint = schema.toString();
      }
      console.log(schemaEndpoint);
      return { url: schemaEndpoint } as Endpoints[0];
    }
    throw new Error(
      'Warning: No Endpoints configured. Config schema contains no URLs',
    );
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

  validUrlFromSchema(pathOrUrl: string) {
    return /^https?:\/\//.test(pathOrUrl);
  }
}
