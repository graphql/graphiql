import { forwardRef } from 'react';
import { clsx } from 'clsx';

import './button-group.css';

export const ButtonGroup = forwardRef<
  HTMLDivElement,
  JSX.IntrinsicElements['div']
>((props, ref) => (
  <div
    {...props}
    ref={ref}
    className={clsx('graphiql-button-group', props.className)}
  />
));
ButtonGroup.displayName = 'ButtonGroup';
