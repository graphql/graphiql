// // / <reference path="../../../node_modules/monaco-editor/monaco.d.ts"/>
// import * as monaco from 'monaco-editor';
// // import { GraphQLExtensionDeclaration } from 'graphql-config'
// import IWorkerContext = monaco.worker.IWorkerContext;

// import * as graphqlService from 'graphql-languageservice';

// import { Position } from 'graphql-language-service-utils';
// import { GraphQLSchema } from 'graphql';
// // @ts-ignore
// import { toMarkerData, toCompletion, toGraphQLPosition } from './utils';

// import {
//   getRange,
//   GraphQLLanguageService,
// } from 'graphql-language-service-interface';

// import {
//   GraphQLConfig,
//   loadConfig,
//   GraphQLExtensionDeclaration,
// } from 'graphql-config';
// import { UrlLoader } from '@graphql-toolkit/url-loader';
// import { TextDocument } from 'vscode-languageserver-textdocument';
// // import { BrowserLoader } from './BrowserLoader'

// const BrowserConfigExtension: GraphQLExtensionDeclaration = api => {
//   api.loaders.schema.register(new UrlLoader());

//   api.loaders.documents.register(new UrlLoader());

//   return {
//     name: 'graphiql',
//   };
// };

// type callbackFnType = (
//   stream: graphqlService.CharacterStream,
//   state: graphqlService.State,
//   style: string,
//   index: number,
// ) => void | 'BREAK';

// function runOnlineParser(
//   queryText: string,
//   callback: callbackFnType,
// ): graphqlService.ContextToken {
//   const lines = queryText.split('\n');
//   const parser = graphqlService.onlineParser();
//   let state = parser.startState();
//   let style = '';

//   let stream = new graphqlService.CharacterStream('');

//   for (let i = 0; i < lines.length; i++) {
//     stream = new graphqlService.CharacterStream(lines[i]);
//     while (!stream.eol()) {
//       style = parser.token(stream, state);
//       const code = callback(stream, state, style, i);
//       if (code === 'BREAK') {
//         break;
//       }
//     }

//     // Above while loop won't run if there is an empty line.
//     // Run the callback one more time to catch this.
//     callback(stream, state, style, i);

//     if (!state.kind) {
//       state = parser.startState();
//     }
//   }

//   return {
//     start: stream.getStartOfToken(),
//     end: stream.getCurrentPosition(),
//     string: stream.current(),
//     state,
//     style,
//   };
// }

// export class GraphQLWorker {
//   private _ctx: IWorkerContext;
//   private _languageService: graphqlService.GraphQLLanguageService | null;
//   // @ts-ignore
//   private _languageSettings: monaco.languages.graphql.LanguageSettings;
//   private _languageId: string;
//   private _schema: GraphQLSchema | null;

//   constructor(ctx: IWorkerContext, createData: ICreateData) {
//     this._ctx = ctx;
//     // this._languageId = createData.languageId;
//     this._schema = null;
//     this._languageService = null;
//     this._languageId = createData.languageId;
//     // @ts-ignore
//     this._languageSettings = createData.languageSettings;
//   }
//   public async getLanguageService(): Promise<GraphQLLanguageService> {
//     if (this._languageService) {
//       return this._languageService;
//     }
//     const config = await loadConfig({
//       filepath: 'default/graphqlrc.yml',
//       extensions: [BrowserConfigExtension],
//     });
//     this._languageService = new graphqlService.GraphQLLanguageService(
//       new graphqlService.GraphQLCache(
//         'default/graphqlrc.yml',
//         config as GraphQLConfig,
//       ),
//     );
//     return this._languageService;
//   }

//   public getTokenAtPosition(
//     documentString: string,
//     position: Position,
//   ): graphqlService.ContextToken {
//     let styleAtCursor = null;
//     let stateAtCursor = null;
//     let stringAtCursor = null;
//     const token = runOnlineParser(
//       documentString,
//       (stream, state, style, index) => {
//         if (index === position.line) {
//           if (stream.getCurrentPosition() >= position.character) {
//             styleAtCursor = style;
//             stateAtCursor = { ...state };
//             stringAtCursor = stream.current();
//             return 'BREAK';
//           }
//         }
//       },
//     );

//     // Return the state/style of parsed token in case those at cursor aren't
//     // available.
//     return {
//       start: token.start,
//       end: token.end,
//       string: stringAtCursor || token.string,
//       state: stateAtCursor || token.state,
//       style: styleAtCursor || token.style,
//     };
//   }

//   async doValidation(uri: string): Promise<monaco.editor.IMarkerData[]> {
//     const ls = await this.getLanguageService();
//     const document = this._getQueryText(uri);

//     if (document) {
//       const graphqlDiagnostics = await ls.getDiagnostics(document, uri);
//       return graphqlDiagnostics.map(toMarkerData);
//     }
//     return Promise.resolve([]);
//   }
//   async doComplete(
//     uri: string,
//     position: monaco.Position,
//   ): Promise<monaco.languages.CompletionItem[]> {
//     console.log('do compleat');
//     const ls = await this.getLanguageService();
//     const document = this._getQueryText(uri);
//     console.log(document);
//     const graphQLPosition = toGraphQLPosition(position);
//     const suggestions = await ls.getAutocompleteSuggestions(
//       document,
//       graphQLPosition,
//       uri,
//     );
//     console.log({ suggestions });

//     return suggestions.map(e =>
//       toCompletion(
//         e,
//         getRange(
//           { column: graphQLPosition.character, line: graphQLPosition.line },
//           document,
//         ),
//       ),
//     );
//   }

//   public async getSchema(
//     projectName?: string,
//     queryHasExtensions?: boolean,
//   ): Promise<GraphQLSchema | null> {
//     const ls = await this.getLanguageService();
//     this._schema = await ls.getSchema(projectName, queryHasExtensions);
//     return this._schema;
//   }

//   private _getTextDocument(uri: string): TextDocument | null {
//     const models = this._ctx.getMirrorModels();
//     for (const model of models) {
//       if (model.uri.toString() === uri) {
//         return TextDocument.create(
//           uri,
//           this._languageId,
//           model.version,
//           model.getValue(),
//         );
//       }
//     }
//     return null;
//   }
//   private _getQueryText(uri: string): string {
//     return this._getTextDocument(uri)?.getText() as string;
//   }
// }

// export interface ICreateData {
//   languageId: string;
//   enableSchemaRequest: boolean;
//   schemaUrl: String;
// }

// export function create(
//   ctx: IWorkerContext,
//   createData: ICreateData,
// ): GraphQLWorker {
//   console.log('CREATE WORKER');
//   return new GraphQLWorker(ctx, createData);
// }
