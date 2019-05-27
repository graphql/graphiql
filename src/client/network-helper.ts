import { ExtractedTemplateLiteral } from "./source-helper";
import { OperationDefinitionNode } from "graphql";

import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { createHttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { InMemoryCache } from "apollo-cache-inmemory";
import * as ws from "ws";

import { GraphQLEndpoint } from "graphql-config";
import { OutputChannel } from "vscode";

export class NetworkHelper {
  private outputChannel: OutputChannel;

  constructor(outputChannel: OutputChannel) {
    this.outputChannel = outputChannel;
  }

  executeOperation({
    endpoint,
    literal,
    variables,
    updateCallback
  }: ExecuteOperationOptions) {
    const operation = (literal.ast.definitions[0] as OperationDefinitionNode)
      .operation;
    this.outputChannel.appendLine(`NetworkHelper: operation: ${operation}`);
    this.outputChannel.appendLine(`NetworkHelper: endpoint: ${endpoint.url}`);

    const httpLink = createHttpLink({
      uri: endpoint.url,
      headers: endpoint.headers
    });

    const wsEndpointURL = endpoint.url.replace(/^http/, "ws");
    const wsLink = new WebSocketLink({
      uri: wsEndpointURL,
      options: {
        reconnect: true,
        inactivityTimeout: 30000
      },
      webSocketImpl: ws
    });

    const apolloClient = new ApolloClient({
      link: operation === "subscription" ? wsLink : httpLink,
      cache: new InMemoryCache({
        addTypename: false
      })
    });

    const parsedOperation = gql`
      ${literal.content}
    `;

    if (operation === "subscription") {
      apolloClient
        .subscribe({
          query: parsedOperation,
          variables
        })
        .subscribe({
          next(data: any) {
            updateCallback(formatData(data), operation);
          }
        });
    } else {
      if (operation === "query") {
        apolloClient
          .query({
            query: parsedOperation,
            variables
          })
          .then((data: any) => {
            updateCallback(formatData(data), operation);
          })
          .catch(err => {
            updateCallback(err.toString(), operation);
          });
      } else {
        apolloClient
          .mutate({
            mutation: parsedOperation,
            variables
          })
          .then((data: any) => {
            updateCallback(formatData(data), operation);
          });
      }
    }
  }
}

export interface ExecuteOperationOptions {
  endpoint: GraphQLEndpoint;
  literal: ExtractedTemplateLiteral;
  variables: { [key: string]: string };
  updateCallback: (data: string, operation: string) => void;
}

function formatData({ data, errors }: any) {
  return JSON.stringify({ data, errors }, null, 2);
}
