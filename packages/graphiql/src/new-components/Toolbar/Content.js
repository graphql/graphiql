/** @jsx jsx */
import { jsx } from 'theme-ui';

const Content = ({ ...props }) => (
  <div
    {...props}
    sx={{
      padding: ({ spaces }) => spaces.rowPadding,
    }}
  />
);

export default Content;
