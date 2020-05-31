/** @jsx jsx */
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
