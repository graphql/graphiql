import { ToolbarButton, useEditorContext } from '@graphiql/react';
import React, {
  ComponentProps,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react';
import HTTPSnippet from 'httpsnippet';

export function CheckIcon(props: ComponentProps<'svg'>): ReactElement {
  return (
    <svg
      viewBox="0 0 20 20"
      width="1em"
      height="1em"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function GraphiQLPluginCopyAs(): ReactElement {
  const [isCopied, setCopied] = useState(false);
  const { queryEditor, variableEditor, headerEditor } = useEditorContext({
    nonNull: true,
  });
  useEffect(() => {
    if (!isCopied) return;
    const timerId = setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => {
      clearTimeout(timerId);
    };
  }, [isCopied]);

  const handleClick = useCallback<
    NonNullable<ComponentProps<'button'>['onClick']>
  >(async () => {
    if (!navigator?.clipboard) {
      // eslint-disable-next-line no-console
      console.error('Access to clipboard rejected!');
      return;
    }
    try {
      const headers = headerEditor?.getValue();
      const variables = variableEditor?.getValue();

      const extendedHeaders = {
        'content-type': 'application/json',
        ...(headers && JSON.parse(headers)),
      };

      const url = new URL(location.origin);
      url.pathname = '/graphql';

      const snippet = new HTTPSnippet({
        method: 'POST',
        url: url.href,
        httpVersion: 'HTTP/1.1',
        headers: Object.entries(extendedHeaders).map(([name, value]) => ({
          name,
          value: value as string,
        })),
        postData: {
          text: JSON.stringify({
            query: queryEditor?.getValue(),
            variables: variables ? JSON.parse(variables) : {},
          }),
          mimeType: '',
        },
        cookies: [],
        queryString: [],
        headersSize: -1,
        bodySize: -1,
      });
      await navigator.clipboard.writeText(
        snippet.convert('shell', 'curl') || '',
      );
      setCopied(true);
    } catch {
      // eslint-disable-next-line no-console
      console.error('Failed to copy!');
    }
  }, [headerEditor, queryEditor, variableEditor]);

  return (
    <ToolbarButton onClick={handleClick} label="Copy as cURL">
      {isCopied ? (
        <CheckIcon className="graphiql-toolbar-icon" />
      ) : (
        <span
          style={{ color: 'hsla(var(--color-neutral), var(--alpha-tertiary))' }}
        >
          cURL
        </span>
      )}
    </ToolbarButton>
  );
}
