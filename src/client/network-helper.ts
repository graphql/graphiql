import {
  ExtractedTemplateLiteral,
  SourceHelper,
  getFragmentDependenciesForAST,
} from "./source-helper"
import { visit, OperationTypeNode } from "graphql"

import ApolloClient from "apollo-client"
import { onError } from "apollo-link-error"

import gql from "graphql-tag"
import { createHttpLink } from "apollo-link-http"
import { WebSocketLink } from "apollo-link-ws"
import { InMemoryCache } from "apollo-cache-inmemory"
import fetch from "node-fetch"
import { Agent } from "https"
import * as ws from "ws"

import { Endpoints } from "graphql-config/extensions/endpoints"
import { OutputChannel, workspace } from "vscode"
import { ApolloLink } from "apollo-link"
import { UserVariables } from "./graphql-content-provider"
import { GraphQLProjectConfig } from "graphql-config"

export type Endpoint = Endpoints[0]

export class NetworkHelper {
  private outputChannel: OutputChannel
  private sourceHelper: SourceHelper

  constructor(outputChannel: OutputChannel, sourceHelper: SourceHelper) {
    this.outputChannel = outputChannel
    this.sourceHelper = sourceHelper
  }
  private buildClient({
    operation,
    endpoint,
    updateCallback,
  }: {
    operation: string
    endpoint: Endpoint
    updateCallback: (data: string, operation: string) => void
  }) {
    const { rejectUnauthorized } = workspace.getConfiguration("vscode-graphql")
    const agent = new Agent({ rejectUnauthorized })

    const httpLink = createHttpLink({
      uri: endpoint.url,
      headers: endpoint.headers,
      fetch,
      fetchOptions: {
        agent,
      },
    })

    const errorLink = onError(({ graphQLErrors, networkError }) => {
      if (networkError) {
        updateCallback(networkError.toString(), operation)
      }
      if (graphQLErrors && graphQLErrors.length > 0) {
        updateCallback(formatData({ errors: graphQLErrors }), operation)
      }
    })

    const wsEndpointURL = endpoint.url.replace(/^http/, "ws")
    const wsLink = new WebSocketLink({
      uri: wsEndpointURL,
      options: {
        reconnect: true,
        inactivityTimeout: 30000,
      },
      webSocketImpl: ws,
    })

    return new ApolloClient({
      link: ApolloLink.from([
        errorLink,
        ApolloLink.split(
          () => {
            return operation === "subscription"
          },
          wsLink,
          httpLink,
        ),
      ]),
      cache: new InMemoryCache({
        addTypename: false,
      }),
    })
  }

  async executeOperation({
    endpoint,
    literal,
    variables,
    updateCallback,
    projectConfig,
  }: ExecuteOperationOptions) {
    const operationTypes: OperationTypeNode[] = []
    const operationNames: string[] = []

    visit(literal.ast, {
      OperationDefinition(node) {
        operationTypes.push(node.operation)
        operationNames.push(node.name?.value || "")
      },
    })
    const fragmentDefinitions = await this.sourceHelper.getFragmentDefinitions(
      projectConfig,
    )

    const fragmentInfos = await getFragmentDependenciesForAST(
      literal.ast,
      fragmentDefinitions,
    )

    fragmentInfos.forEach(fragmentInfo => {
      literal.content = fragmentInfo.content + "\n" + literal.content
    })

    const parsedOperation = gql`
      ${literal.content}
    `
    return Promise.all(
      operationTypes.map(async operation => {
        this.outputChannel.appendLine(`NetworkHelper: operation: ${operation}`)
        this.outputChannel.appendLine(
          `NetworkHelper: endpoint: ${endpoint.url}`,
        )

        const apolloClient = this.buildClient({
          operation,
          endpoint,
          updateCallback,
        })
        if (operation === "subscription") {
          await apolloClient
            .subscribe({
              query: parsedOperation,
              variables,
            })
            .subscribe({
              next(data: any) {
                updateCallback(formatData(data), operation)
              },
            })
        } else {
          if (operation === "query") {
            const data = await apolloClient.query({
              query: parsedOperation,
              variables,
              errorPolicy: "all",
            })
            updateCallback(formatData(data), operation)
          } else {
            const data = await apolloClient.mutate({
              mutation: parsedOperation,
              variables,
              errorPolicy: "all",
            })
            updateCallback(formatData(data), operation)
          }
        }
      }),
    )
  }
}

export interface ExecuteOperationOptions {
  endpoint: Endpoint
  literal: ExtractedTemplateLiteral
  variables: UserVariables
  updateCallback: (data: string, operation: string) => void
  projectConfig: GraphQLProjectConfig
}

function formatData({ data, errors }: any) {
  return JSON.stringify({ data, errors }, null, 2)
}
