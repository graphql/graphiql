/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { jsx } from 'theme-ui';
import { DetailedHTMLProps } from 'react';

export type ContentProps = DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

const Content = ({ ...props }: ContentProps) => (
  <div
    {...props}
    sx={{
      padding: ({ spaces }) => spaces.rowPadding,
    }}
  />
);

export default Content;
