/** @jsx jsx */

import { jsx, SxStyleProp } from 'theme-ui';
import * as React from 'react';

export default function EditorWrapper(
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > & {
    sx?: SxStyleProp;
    innerRef: any;
  },
) {
  const { innerRef, sx, ...rest } = props;
  return (
    <div
      {...rest}
      ref={innerRef}
      sx={{
        height: '100%',
        ...sx,
      }}
    />
  );
}
