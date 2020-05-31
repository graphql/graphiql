/** @jsx jsx */
import { jsx } from 'theme-ui';
import WithDividers from './support/WithDividers';
import { PropsWithChildren } from 'react';
import { JustifyContentProperty } from 'csstype';

export type ToolbarPropTypes = PropsWithChildren<{
  justifyContent?: JustifyContentProperty;
}>;

const Toolbar = ({
  children,
  justifyContent = 'space-between',
}: ToolbarPropTypes) => {
  const needsExtraPadding = !justifyContent.includes('space');
  return (
    <div
      sx={{
        overflow: 'auto',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent,
      }}>
      {needsExtraPadding ? (
        <WithDividers padding>{children}</WithDividers>
      ) : (
        children
      )}
    </div>
  );
};

export default Toolbar;
