import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '../../utility';
import './index.css';

export const Spinner = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>((props, ref) => (
  <div
    {...props}
    ref={ref}
    className={cn('graphiql-spinner', props.className)}
  />
));
Spinner.displayName = 'Spinner';
