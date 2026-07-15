import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { clsx } from 'clsx';
import './index.css';

export const Spinner = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>((props, ref) => (
  <div
    {...props}
    ref={ref}
    className={clsx('graphiql-spinner', props.className)}
  />
));
Spinner.displayName = 'Spinner';
