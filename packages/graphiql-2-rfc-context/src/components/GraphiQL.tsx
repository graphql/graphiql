/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { ComponentType, PropsWithChildren } from 'react';
import { GraphQLSchema, OperationDefinitionNode, GraphQLType } from 'graphql';

import type { SchemaConfig } from 'graphql-language-service';

import { ExecuteButton } from './ExecuteButton';
import { ToolbarButton } from './ToolbarButton';
import { QueryEditor } from './QueryEditor';
import { VariableEditor } from './VariableEditor';
import { ResultViewer } from './ResultViewer';
import { DocExplorer } from './DocExplorer';
import { QueryHistory } from './QueryHistory';
import StorageAPI, { Storage } from '../utility/StorageAPI';
import { VariableToType } from '../utility/getQueryFacts';

import find from '../utility/find';
import { GetDefaultFieldNamesFn, fillLeafs } from '../utility/fillLeafs';

import {
  SchemaProvider,
  SchemaContext,
} from '../api/providers/GraphiQLSchemaProvider';
import { EditorsProvider } from '../api/providers/GraphiQLEditorsProvider';
import {
  SessionProvider,
  SessionContext,
} from '../api/providers/GraphiQLSessionProvider';
import { getFetcher } from '../api/common';

import { Unsubscribable, Fetcher, ReactNodeLike } from '../types';
import { Provider, useThemeLayout } from './common/themes/provider';
import Tabs from './common/Toolbar/Tabs';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

const majorVersion = parseInt(React.version.slice(0, 2), 10);

if (majorVersion < 16) {
  throw Error(
    [
      'GraphiQL 0.18.0 and after is not compatible with React 15 or below.',
      'If you are using a CDN source (jsdelivr, unpkg, etc), follow this example:',
      'https://github.com/graphql/graphiql/blob/main/examples/graphiql-cdn/index.html#L49',
    ].join('\n'),
  );
}

declare namespace global {
  export let g: GraphiQLInternals;
}

type Formatters = {
  formatResult: (result: any) => string;
  formatError: (rawError: Error) => string;
};

export type Maybe<T> = T | null | undefined;

export type GraphiQLProps = {
  uri: string;
  fetcher?: Fetcher;
  schemaConfig?: SchemaConfig;
  schema: GraphQLSchema | null;
  query?: string;
  variables?: string;
  headers?: string;
  operationName?: string;
  response?: string;
  storage?: Storage;
  defaultQuery?: string;
  defaultVariableEditorOpen?: boolean;
  defaultSecondaryEditorOpen?: boolean;
  headerEditorEnabled?: boolean;
  onCopyQuery?: (query?: string) => void;
  onEditQuery?: (query?: string) => void;
  onEditVariables?: (value: string) => void;
  onEditHeaders?: (value: string) => void;
  onEditOperationName?: (operationName: string) => void;
  onToggleDocs?: (docExplorerOpen: boolean) => void;
  getDefaultFieldNames?: GetDefaultFieldNamesFn;
  editorTheme?: string;
  onToggleHistory?: (historyPaneOpen: boolean) => void;
  readOnly?: boolean;
  docExplorerOpen?: boolean;
  formatResult?: (result: any) => string;
  formatError?: (rawError: Error) => string;
  variablesEditorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
  operationEditorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
  resultsEditorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
} & Partial<Formatters>;

export type GraphiQLState = {
  schema?: GraphQLSchema;
  query?: string;
  variables?: string;
  headers?: string;
  operationName?: string;
  response?: string;
  isWaitingForResponse: boolean;
  subscription?: Unsubscribable | null;
  variableToType?: VariableToType;
  operations?: OperationDefinitionNode[];
};

/**
 * The top-level React component for GraphiQL, intended to encompass the entire
 * browser viewport.
 *
 * @see https://github.com/graphql/graphiql#usage
 */
export const GraphiQL: React.FC<GraphiQLProps> = props => {
  if (!props.fetcher && !props.uri) {
    throw Error(i18n.t('Errors:Fetcher or uri property are required'));
  }
  const fetcher = getFetcher(props);
  return (
    <I18nextProvider i18n={i18n}>
      <EditorsProvider>
        <SchemaProvider
          fetcher={fetcher}
          config={{ uri: props.uri, ...props.schemaConfig }}>
          <SessionProvider fetcher={fetcher} sessionId={0}>
            <GraphiQLInternals
              {...{
                formatResult,
                formatError,
                ...props,
              }}>
              {props.children}
            </GraphiQLInternals>
          </SessionProvider>
        </SchemaProvider>
      </EditorsProvider>
    </I18nextProvider>
  );
};

const formatResult = (result: any) => {
  return JSON.stringify(result, null, 2);
};

const formatError = (rawError: Error) => {
  const result = Array.isArray(rawError)
    ? rawError.map(formatSingleError)
    : formatSingleError(rawError);
  return JSON.stringify(result, null, 2);
};

// Add a select-option input to the Toolbar.
// GraphiQLSelect = ToolbarSelect;
// GraphiQLSelectOption = ToolbarSelectOption;

type GraphiQLInternalsProps = GraphiQLProps & Formatters;

/**
 * GraphiQL implementation details, intended to only be used via
 * the GraphiQL component
 */
class GraphiQLInternals extends React.Component<
  GraphiQLProps & Formatters,
  GraphiQLState
> {
  // Ensure only the last executed editor query is rendered.
  _editorQueryID = 0;
  _storage: StorageAPI;
  // refs
  graphiqlContainer: Maybe<HTMLDivElement>;
  resultComponent: Maybe<typeof ResultViewer>;
  variableEditorComponent: Maybe<typeof VariableEditor>;
  _queryHistory: Maybe<typeof QueryHistory>;
  editorBarComponent: Maybe<HTMLDivElement>;
  queryEditorComponent: Maybe<typeof QueryEditor>;
  resultViewerElement: Maybe<HTMLElement>;

  constructor(props: GraphiQLInternalsProps & Formatters) {
    super(props);
    // Ensure props are correct
    if (typeof props.fetcher !== 'function') {
      throw new TypeError('GraphiQL requires a fetcher function.');
    }

    // Cache the storage instance
    this._storage = new StorageAPI(props.storage);

    // Initialize state
    this.state = {
      response: props.response,
      isWaitingForResponse: false,
      subscription: null,
    };
  }

  componentDidMount() {
    // Allow async state changes

    // Only fetch schema via introspection if a schema has not been
    // provided, including if `null` was provided.
    // if (this.context.schema === undefined) {
    //   this.fetchSchema();
    // }
    // Utility for keeping CodeMirror correctly sized.

    global.g = this;
  }
  // When the component is about to unmount, store any persistable state, such
  // that when the component is remounted, it will use the last used values.

  render() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const Layout = useThemeLayout();
    const children = React.Children.toArray(this.props.children);
    const logo = find(children, child =>
      isChildComponentType(child, GraphiQLLogo),
    ) || <GraphiQLLogo />;

    const footer = find(children, child =>
      isChildComponentType(child, GraphiQLFooter),
    );

    // const queryWrapStyle = {
    //   WebkitFlex: this.state.editorFlex,
    //   flex: this.state.editorFlex,
    // };

    // const variableOpen = this.state.variableEditorOpen;
    // const variableStyle = {
    //   height: variableOpen ? this.state.variableEditorHeight : undefined,
    // };

    const SessionTabs = ({
      name,
      tabs,
      children: c,
    }: {
      name: string;
      tabs: Array<ReactNodeLike>;
      children: Array<ReactNodeLike>;
    }) => (
      <SessionContext.Consumer>
        {session => (
          <Tabs
            active={session?.currentTabs?.[name] as number}
            tabs={tabs}
            onChange={tabId => session.changeTab(name, tabId)}>
            {c}
          </Tabs>
        )}
      </SessionContext.Consumer>
    );

    const operationEditor = (
      // <div
      //   ref={n => {
      //     this.editorBarComponent = n;
      //   }}
      //   className="editorBar"
      //   onDoubleClick={this.handleResetResize}
      //   onMouseDown={this.handleResizeStart}>
      //   <div className="queryWrap" style={queryWrapStyle}>
      <section aria-label="Operation Editor">
        <SessionTabs tabs={[`Operation`, `Explorer`]} name="operation">
          <QueryEditor
            onHintInformationRender={this.handleHintInformationRender}
            onClickReference={this.handleClickReference}
            editorTheme={this.props.editorTheme}
            readOnly={this.props.readOnly}
            editorOptions={this.props.operationEditorOptions}
          />
          <div>Explorer</div>
        </SessionTabs>
      </section>
    );

    const variables = (
      <section aria-label="Query Variables">
        <SessionTabs tabs={[`Variables`, `Console`]} name="variables">
          <VariableEditor
            onHintInformationRender={this.handleHintInformationRender}
            onPrettifyQuery={this.handlePrettifyQuery}
            onMergeQuery={this.handleMergeQuery}
            editorTheme={this.props.editorTheme}
            readOnly={this.props.readOnly}
            editorOptions={this.props.variablesEditorOptions}
          />
          <div>Console</div>
        </SessionTabs>
      </section>
    );

    const response = (
      <section aria-label="Response Editor">
        <SessionTabs
          tabs={[`Response`, `Extensions`, `Playground`]}
          name="results">
          <>
            {this.state.isWaitingForResponse && (
              <div className="spinner-container">
                <div className="spinner" />
              </div>
            )}
            <ResultViewer
              editorTheme={this.props.editorTheme}
              editorOptions={this.props.resultsEditorOptions}
            />
            {footer}
          </>
          <div>Extensions</div>
          <div>Playground</div>
        </SessionTabs>
      </section>
    );

    return (
      <Provider>
        <Layout
          nav={
            <>
              <GraphiQLToolbar>
                {logo}
                <ExecuteButton
                  isRunning={Boolean(this.state.subscription)}
                  onStop={() => null}
                />
                <ToolbarButton
                  onClick={this.handlePrettifyQuery}
                  title="Prettify Query (Shift-Ctrl-P)"
                  label="Prettify"
                />
                <ToolbarButton
                  onClick={this.handleMergeQuery}
                  title="Merge Query (Shift-Ctrl-M)"
                  label="Merge"
                />
                <ToolbarButton
                  onClick={this.handleCopyQuery}
                  title="Copy Query (Shift-Ctrl-C)"
                  label="Copy"
                />
                <ToolbarButton
                  onClick={() => null}
                  title="Show History"
                  label="History"
                />
                <ToolbarButton
                  onClick={() => null}
                  title="Open Documentation Explorer"
                  label="Docs"
                />
              </GraphiQLToolbar>
            </>
          }
          session={{
            input: operationEditor,
            response,
            console: variables,
          }}
          navPanels={[
            // TODO: rewrite this for plugin API
            ...(true
              ? [
                  {
                    key: 'docs',
                    size: 'sidebar' as const,
                    component: (
                      <SchemaContext.Consumer>
                        {({ schema }) => <DocExplorer schema={schema} />}
                      </SchemaContext.Consumer>
                    ),
                  },
                ]
              : []),
            // TODO: rewrite this for plugin API

            ...(true
              ? [
                  {
                    key: 'history',
                    size: 'sidebar' as const,
                    component: (
                      <SessionContext.Consumer>
                        {session => {
                          return (
                            <QueryHistory
                              onSelectQuery={(operation, vars, _opName) => {
                                if (operation) {
                                  session.changeOperation(operation);
                                }
                                if (vars) {
                                  session.changeVariables(vars);
                                }
                              }}
                              storage={this._storage}
                              queryID={this._editorQueryID}>
                              <button
                                className="docExplorerHide"
                                onClick={() => null}
                                aria-label="Close History">
                                {'\u2715'}
                              </button>
                            </QueryHistory>
                          );
                        }}
                      </SessionContext.Consumer>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Provider>
    );
  }

  /**
   * Inspect the query, automatically filling in selection sets for non-leaf
   * fields which do not yet have them.
   *
   * @public
   */
  public autoCompleteLeafs() {
    const { insertions, result } = fillLeafs(
      this.context.schema,
      this.context?.operation.text,
      this.props.getDefaultFieldNames,
    );
    if (insertions && insertions.length > 0) {
      // @ts-ignore
      const editor = this.getQueryEditor();
      if (editor) {
        editor.operation(() => {
          const cursor = editor.getCursor();
          const cursorIndex = editor.indexFromPos(cursor);
          editor.setValue(result || '');
          let added = 0;
          const markers = insertions.map(({ index, string }) =>
            editor.markText(
              editor.posFromIndex(index + added),
              editor.posFromIndex(index + (added += string.length)),
              {
                className: 'autoInsertedLeaf',
                clearOnEnter: true,
                title: 'Automatically added leaf fields',
              },
            ),
          );
          setTimeout(() => markers.forEach(marker => marker.clear()), 7000);
          let newCursorIndex = cursorIndex;
          insertions.forEach(({ index, string }) => {
            if (index < cursorIndex) {
              newCursorIndex += string.length;
            }
          });
          editor.setCursor(editor.posFromIndex(newCursorIndex));
        });
      }
    }
    return result;
  }

  handleClickReference = (_reference: GraphQLType) => {
    // this.setState({ docExplorerOpen: true }, () => {
    //   if (this.docExplorerComponent) {
    //     this.docExplorerComponent.showDocForReference(reference);
    //   }
    // });
  };

  // handleStopQuery = () => {
  //   const subscription = this.state.subscription;
  //   this.setState({
  //     isWaitingForResponse: false,
  //     subscription: null,
  //   });
  //   if (subscription) {
  //     subscription.unsubscribe();
  //   }
  // };

  handlePrettifyQuery = () => {
    // const editor = this.getQueryEditor();
    // const editorContent = editor?.getValue() ?? '';
    // const prettifiedEditorContent = print(parse(editorContent));
    // if (prettifiedEditorContent !== editorContent) {
    //   editor?.setValue(prettifiedEditorContent);
    // }
    // const variableEditor = this.getVariableEditor();
    // const variableEditorContent = variableEditor?.getValue() ?? '';
    // try {
    //   const prettifiedVariableEditorContent = JSON.stringify(
    //     JSON.parse(variableEditorContent),
    //     null,
    //     2,
    //   );
    //   if (prettifiedVariableEditorContent !== variableEditorContent) {
    //     variableEditor?.setValue(prettifiedVariableEditorContent);
    //   }
    // } catch {
    //   /* Parsing JSON failed, skip prettification */
    // }
  };

  handleMergeQuery = () => {
    // const editor = this.getQueryEditor() as CodeMirror.Editor;
    // const query = editor.getValue();
    // if (!query) {
    //   return;
    // }
    // const ast = parse(query);
    // editor.setValue(print(mergeAST(ast)));
  };
  handleCopyQuery = () => {
    // const editor = this.getQueryEditor();
    // const query = editor && editor.getValue();
    // if (!query) {
    //   return;
    // }
    // copyToClipboard(query);
    // if (this.props.onCopyQuery) {
    //   return this.props.onCopyQuery(query);
    // }
  };
  handleEditOperationName = (operationName: string) => {
    const onEditOperationName = this.props.onEditOperationName;
    if (onEditOperationName) {
      onEditOperationName(operationName);
    }
  };

  handleHintInformationRender = (elem: HTMLDivElement) => {
    elem.addEventListener('click', this._onClickHintInformation);

    let onRemoveFn: EventListener;
    elem.addEventListener(
      'DOMNodeRemoved',
      (onRemoveFn = () => {
        elem.removeEventListener('DOMNodeRemoved', onRemoveFn);
        elem.removeEventListener('click', this._onClickHintInformation);
      }),
    );
  };

  private _onClickHintInformation = (
    event: MouseEvent | React.MouseEvent<HTMLDivElement>,
  ) => {
    if (
      event?.currentTarget &&
      'className' in event.currentTarget &&
      event.currentTarget.className === 'typeName'
    ) {
      const typeName = event.currentTarget.innerHTML;
      const schema = this.context.schema;
      if (schema) {
        const type = schema.getType(typeName);
        if (type) {
          // this.setState({ docExplorerOpen: true }, () => {
          //   if (this.docExplorerComponent) {
          //     this.docExplorerComponent.showDoc(type);
          //   }
          // });
        }
      }
    }
  };

  // handleToggleDocs = () => {
  //   if (typeof this.props.onToggleDocs === 'function') {
  //     this.props.onToggleDocs(!this.state.docExplorerOpen);
  //   }
  //   this.setState({ docExplorerOpen: !this.state.docExplorerOpen });
  //   this._storage.set(
  //     'docExplorerOpen',
  //     JSON.stringify(this.state.docExplorerOpen),
  //   );
  // };

  // handleToggleHistory = () => {
  //   if (typeof this.props.onToggleHistory === 'function') {
  //     this.props.onToggleHistory(!this.state.historyPaneOpen);
  //   }
  //   this.setState({ historyPaneOpen: !this.state.historyPaneOpen });
  //   this._storage.set(
  //     'historyPaneOpen',
  //     JSON.stringify(this.state.historyPaneOpen),
  //   );
  // };

  // private handleResizeStart = (downEvent: React.MouseEvent) => {
  //   if (!this._didClickDragBar(downEvent)) {
  //     return;
  //   }

  //   downEvent.preventDefault();

  //   const offset = downEvent.clientX - getLeft(downEvent.target as HTMLElement);

  //   let onMouseMove: OnMouseMoveFn = moveEvent => {
  //     if (moveEvent.buttons === 0) {
  //       return onMouseUp!();
  //     }

  //     const editorBar = this.editorBarComponent as HTMLElement;
  //     const leftSize = moveEvent.clientX - getLeft(editorBar) - offset;
  //     const rightSize = editorBar.clientWidth - leftSize;
  //     this.setState({ editorFlex: leftSize / rightSize });
  //   };

  //   let onMouseUp: OnMouseUpFn = () => {
  //     document.removeEventListener('mousemove', onMouseMove!);
  //     document.removeEventListener('mouseup', onMouseUp!);
  //     onMouseMove = null;
  //     onMouseUp = null;
  //   };

  //   document.addEventListener('mousemove', onMouseMove);
  //   document.addEventListener('mouseup', onMouseUp);
  // };

  // handleResetResize = () => {
  //   this.setState({ editorFlex: 1 });
  //   this._storage.set('editorFlex', JSON.stringify(this.state.editorFlex));
  // };

  // private _didClickDragBar(event: React.MouseEvent) {
  //   // Only for primary unmodified clicks
  //   if (event.button !== 0 || event.ctrlKey) {
  //     return false;
  //   }
  //   let target = event.target as Element;
  //   // Specifically the result window's drag bar.
  //   const resultWindow = this.resultViewerElement;
  //   while (target) {
  //     if (target === resultWindow) {
  //       return true;
  //     }
  //     target = target.parentNode as Element;
  //   }
  //   return false;
  // }

  // private handleDocsResizeStart: MouseEventHandler<
  //   HTMLDivElement
  // > = downEvent => {
  //   downEvent.preventDefault();

  //   const hadWidth = this.state.docExplorerWidth;
  //   const offset = downEvent.clientX - getLeft(downEvent.target as HTMLElement);

  //   let onMouseMove: OnMouseMoveFn = moveEvent => {
  //     if (moveEvent.buttons === 0) {
  //       return onMouseUp!();
  //     }

  //     const app = this.graphiqlContainer as HTMLElement;
  //     const cursorPos = moveEvent.clientX - getLeft(app) - offset;
  //     const docsSize = app.clientWidth - cursorPos;

  //     if (docsSize < 100) {
  //       this.setState({ docExplorerOpen: false });
  //     } else {
  //       this.setState({
  //         docExplorerOpen: true,
  //         docExplorerWidth: Math.min(docsSize, 650),
  //       });
  //     }
  //   };

  //   let onMouseUp: OnMouseUpFn = () => {
  //     if (!this.state.docExplorerOpen) {
  //       this.setState({ docExplorerWidth: hadWidth });
  //     }

  //     document.removeEventListener('mousemove', onMouseMove!);
  //     document.removeEventListener('mouseup', onMouseUp!);
  //     onMouseMove = null;
  //     onMouseUp = null;
  //   };

  //   document.addEventListener('mousemove', onMouseMove!);
  //   document.addEventListener('mouseup', onMouseUp);
  // };

  // private handleDocsResetResize = () => {
  //   this.setState({
  //     docExplorerWidth: DEFAULT_DOC_EXPLORER_WIDTH,
  //   });
  // };

  // private handleVariableResizeStart: MouseEventHandler<
  //   HTMLDivElement
  // > = downEvent => {
  //   downEvent.preventDefault();

  //   let didMove = false;
  //   const wasOpen = this.state.variableEditorOpen;
  //   const hadHeight = this.state.variableEditorHeight;
  //   const offset = downEvent.clientY - getTop(downEvent.target as HTMLElement);

  //   let onMouseMove: OnMouseMoveFn = moveEvent => {
  //     if (moveEvent.buttons === 0) {
  //       return onMouseUp!();
  //     }

  //     didMove = true;

  //     const editorBar = this.editorBarComponent as HTMLElement;
  //     const topSize = moveEvent.clientY - getTop(editorBar) - offset;
  //     const bottomSize = editorBar.clientHeight - topSize;
  //     if (bottomSize < 60) {
  //       this.setState({
  //         variableEditorOpen: false,
  //         variableEditorHeight: hadHeight,
  //       });
  //     } else {
  //       this.setState({
  //         variableEditorOpen: true,
  //         variableEditorHeight: bottomSize,
  //       });
  //     }
  //   };

  //   let onMouseUp: OnMouseUpFn = () => {
  //     if (!didMove) {
  //       this.setState({ variableEditorOpen: !wasOpen });
  //     }

  //     document.removeEventListener('mousemove', onMouseMove!);
  //     document.removeEventListener('mouseup', onMouseUp!);
  //     onMouseMove = null;
  //     onMouseUp = null;
  //   };

  //   document.addEventListener('mousemove', onMouseMove);
  //   document.addEventListener('mouseup', onMouseUp);
  // };
}

// // Configure the UI by providing this Component as a child of GraphiQL
function GraphiQLLogo<TProps>(props: PropsWithChildren<TProps>) {
  return (
    <div className="title">
      {props.children || (
        <span>
          Graph
          <em>i</em>
          QL
        </span>
      )}
    </div>
  );
}
GraphiQLLogo.displayName = 'GraphiQLLogo';

// Configure the UI by providing this Component as a child of GraphiQL
function GraphiQLToolbar<TProps>(props: PropsWithChildren<TProps>) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Editor Commands">
      {props.children}
    </div>
  );
}
GraphiQLToolbar.displayName = 'GraphiQLToolbar';

// Configure the UI by providing this Component as a child of GraphiQL
function GraphiQLFooter<TProps>(props: PropsWithChildren<TProps>) {
  return <div className="footer">{props.children}</div>;
}
GraphiQLFooter.displayName = 'GraphiQLFooter';

const formatSingleError = (error: Error) => ({
  ...error,
  // Raise these details even if they're non-enumerable
  message: error.message,
  stack: error.stack,
});

// Determines if the React child is of the same type of the provided React component
function isChildComponentType<T extends ComponentType>(
  child: any,
  component: T,
): child is T {
  if (
    child?.type?.displayName &&
    child.type.displayName === component.displayName
  ) {
    return true;
  }

  return child.type === component;
}
