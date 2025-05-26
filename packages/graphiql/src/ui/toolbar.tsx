import type { FC, ReactNode } from 'react';
import {
  CopyIcon,
  copyQuery,
  KEY_MAP,
  MergeIcon,
  mergeQuery,
  prettifyEditors,
  PrettifyIcon,
  ToolbarButton,
} from '@graphiql/react';

const DefaultToolbarRenderProps: FC<{
  prettify: ReactNode;
  copy: ReactNode;
  merge: ReactNode;
}> = ({ prettify, copy, merge }) => (
  <>
    {prettify}
    {merge}
    {copy}
  </>
);

/**
 * Configure the UI by providing this Component as a child of GraphiQL.
 */
export const GraphiQLToolbar: FC<{
  children?: typeof DefaultToolbarRenderProps;
}> = ({ children = DefaultToolbarRenderProps }) => {
  if (typeof children !== 'function') {
    throw new TypeError(
      'The `GraphiQL.Toolbar` component requires a render prop function as its child.',
    );
  }

  const prettify = (
    <ToolbarButton
      onClick={prettifyEditors}
      label={`Prettify query (${KEY_MAP.prettify.key})`}
    >
      <PrettifyIcon className="graphiql-toolbar-icon" aria-hidden="true" />
    </ToolbarButton>
  );

  const merge = (
    <ToolbarButton
      onClick={mergeQuery}
      label={`Merge fragments into query (${KEY_MAP.mergeFragments.key})`}
    >
      <MergeIcon className="graphiql-toolbar-icon" aria-hidden="true" />
    </ToolbarButton>
  );

  const copy = (
    <ToolbarButton
      onClick={copyQuery}
      label={`Copy query (${KEY_MAP.copyQuery.key})`}
    >
      <CopyIcon className="graphiql-toolbar-icon" aria-hidden="true" />
    </ToolbarButton>
  );

  return children({ prettify, copy, merge });
};
