import { forwardRef } from 'react';

import './button-group.css';

export const ButtonGroup = forwardRef<
  HTMLDivElement,
  JSX.IntrinsicElements['div']
>((props, ref) => (
  <div
    {...props}
    ref={ref}
    className={`graphiql-button-group ${props.className || ''}`.trim()}
  />
));
ButtonGroup.displayName = 'ButtonGroup';
