import type { FC, ReactElement, ReactNode } from 'react';
import {
  CopyIcon,
  KEY_MAP,
  MergeIcon,
  PrettifyIcon,
  ToolbarButton,
  useGraphiQLActions,
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
 * Not rendered by default: the tab strip's action buttons cover prettify,
 * merge, and copy out of the box. This remains available for embedders who
 * want the standalone toolbar.
 */
export const GraphiQLToolbar: FC<{
  children?: typeof DefaultToolbarRenderProps | ReactNode;
}> = ({ children = DefaultToolbarRenderProps }) => {
  const isRenderProp = typeof children === 'function';
  const { copyQuery, prettifyEditors, mergeQuery } = useGraphiQLActions();

  if (!isRenderProp) {
    return (
      <div
        className="graphiql-toolbar"
        role="toolbar"
        aria-label="Editor Commands"
      >
        {children as ReactElement}
      </div>
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

  const rendered = (children as typeof DefaultToolbarRenderProps)({
    prettify,
    copy,
    merge,
  }) as ReactElement;

  return (
    <div
      className="graphiql-toolbar"
      role="toolbar"
      aria-label="Editor Commands"
    >
      {rendered}
    </div>
  );
};
