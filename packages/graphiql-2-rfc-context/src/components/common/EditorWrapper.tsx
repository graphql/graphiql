/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

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
