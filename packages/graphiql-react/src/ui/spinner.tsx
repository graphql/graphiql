import { forwardRef } from 'react';
import { compose } from '../utility/compose';

import './spinner.css';

export const Spinner = forwardRef<HTMLDivElement, JSX.IntrinsicElements['div']>(
  (props, ref) => (
    <div
      {...props}
      ref={ref}
      className={compose('graphiql-spinner', props.className)}
    />
  ),
);
Spinner.displayName = 'Spinner';
