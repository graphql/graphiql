import { forwardRef } from 'react';
import { clsx } from 'clsx';

import './spinner.css';

export const Spinner = forwardRef<HTMLDivElement, JSX.IntrinsicElements['div']>(
  (props, ref) => (
    <div
      {...props}
      ref={ref}
      className={clsx('graphiql-spinner', props.className)}
    />
  ),
);
Spinner.displayName = 'Spinner';
