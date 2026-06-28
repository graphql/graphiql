import { formatError } from '@graphiql/toolkit';
import { ComponentType, FC, useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useGraphiQL, useGraphiQLActions } from './provider';
import { ImagePreview } from './image-preview';
import { ResponseHeader } from './response-header';
import { ResponseTableView } from './response-table-view';
import { ResponseTreeView } from './response-tree-view';
import {
  getOrCreateModel,
  createEditor,
  onEditorContainerKeyDown,
} from '../utility/create-editor';
import { Range } from '../utility/monaco-ssr';
import { pick, cleanupDisposables, cn } from '../utility';
import { KEY_BINDINGS, URI_NAME } from '../constants';
import type { EditorProps } from '../types';
import type * as monaco from 'monaco-editor';
import { useMonaco } from '../stores';
import type { ResponseView } from '../stores';

type ResponseTooltipType = ComponentType<{
  /**
   * A position in the editor.
   */
  position: monaco.Position;
  /**
   * Word that has been hovered over.
   */
  word: monaco.editor.IWordAtPosition;
}>;

interface ResponseEditorProps extends EditorProps {
  /**
   * Customize the tooltip when hovering over properties in the response editor.
   */
  responseTooltip?: ResponseTooltipType;
}

export const ResponseEditor: FC<ResponseEditorProps> = ({
  responseTooltip: ResponseTooltip,
  ...props
}) => {
  const { setEditor, run, setResponseView, dismissTransportUpgradeBanner } =
    useGraphiQLActions();
  const {
    fetchError,
    validationErrors,
    responseEditor,
    uriInstanceId,
    lastResponse,
    responseView,
    transport,
    transportUpgradeBannerDismissed,
  } = useGraphiQL(
    pick(
      'fetchError',
      'validationErrors',
      'responseEditor',
      'uriInstanceId',
      'lastResponse',
      'responseView',
      'transport',
      'transportUpgradeBannerDismissed',
    ),
  );
  const ref = useRef<HTMLDivElement>(null!);

  async function handleCopy() {
    const value = responseEditor?.getValue();
    if (value) {
      await navigator.clipboard.writeText(value);
    }
  }

  function handleViewChange(view: ResponseView) {
    setResponseView(view);
  }
  const monaco = useMonaco(state => state.monaco);
  useEffect(() => {
    if (fetchError) {
      responseEditor?.setValue(fetchError);
    }
    if (validationErrors.length) {
      responseEditor?.setValue(formatError(validationErrors));
    }
  }, [responseEditor, fetchError, validationErrors]);

  useEffect(() => {
    if (!monaco) {
      return;
    }
    const model = getOrCreateModel({
      uri: `${uriInstanceId}${URI_NAME.response}`,
      value: '',
    });
    const editor = createEditor(ref, {
      model,
      readOnly: true,
      lineNumbers: 'off',
      wordWrap: 'on', // Toggle word wrap on resizing editors
      contextmenu: false, // Disable the right-click context menu
    });
    setEditor({ responseEditor: editor });

    let lastRoot: Root | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const provideHover: monaco.languages.HoverProvider['provideHover'] = (
      $model,
      position,
    ) => {
      const sameModel = $model.uri === model.uri;
      if (!sameModel) {
        return null; // Ignore for other editors
      }
      const wordAtPosition = $model.getWordAtPosition(position);
      if (!wordAtPosition?.word.startsWith('/')) {
        return null;
      }
      const shouldRender = ImagePreview.shouldRender(wordAtPosition.word);
      if (!shouldRender) {
        return null;
      }

      // Return a placeholder content with a unique ID for now
      const hoverId = `hover-${position.lineNumber}-${position.column}`;
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => {
        const el = document.querySelector<HTMLDivElement>(
          `[data-id="${hoverId}"]`,
        );
        if (!el) {
          return;
        }
        lastRoot?.unmount();
        lastRoot = createRoot(el);
        lastRoot.render(
          // Handle image tooltips and custom tooltips
          <>
            {ResponseTooltip && (
              <ResponseTooltip position={position} word={wordAtPosition} />
            )}
            <ImagePreview path={wordAtPosition.word} />
          </>,
        );
      }, 500);

      return {
        range: new Range(
          position.lineNumber,
          wordAtPosition.startColumn,
          position.lineNumber,
          wordAtPosition.endColumn,
        ),
        contents: [
          {
            value: `<div data-id="${hoverId}">Loading...</div>`,
            supportHtml: true,
          },
        ],
      };
    };
    const languageId = model.getLanguageId();
    const disposables = [
      monaco.languages.registerHoverProvider(languageId, { provideHover }),
      editor.addAction({ ...KEY_BINDINGS.runQuery, run }),
      editor,
      model,
    ];
    return cleanupDisposables(disposables);
  }, [monaco]); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  const isFetcherPath = !transport;
  const showUpgradeBanner = isFetcherPath && !transportUpgradeBannerDismissed;
  const showHeader = !isFetcherPath || showUpgradeBanner;

  return (
    <div {...props} className={cn('graphiql-response-pane', props.className)}>
      {showHeader && (
        <ResponseHeader
          status={lastResponse?.status}
          statusText={lastResponse?.statusText}
          timeMs={
            lastResponse?.timing.totalMs !== undefined
              ? Math.round(lastResponse.timing.totalMs)
              : undefined
          }
          sizeBytes={lastResponse?.size.response}
          upgradeNotice={
            showUpgradeBanner
              ? {
                  href: 'https://github.com/graphql/graphiql/blob/main/docs/migration/graphiql-6.0.0.md',
                  onDismiss: dismissTransportUpgradeBanner,
                }
              : undefined
          }
          view={responseView}
          onViewChange={handleViewChange}
          onCopy={handleCopy}
        />
      )}
      <section
        ref={ref}
        aria-label="Result Window"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={0}
        onKeyDown={onEditorContainerKeyDown}
        className="result-window"
        hidden={responseView !== 'json'}
      />
      {responseView === 'tree' &&
        (lastResponse ? (
          <ResponseTreeView data={lastResponse.body} />
        ) : (
          <div className="graphiql-response-empty-state" role="status">
            <span>Run a query to see the tree view.</span>
          </div>
        ))}
      {responseView === 'table' && (
        <ResponseTableView data={lastResponse?.body} />
      )}
    </div>
  );
};
