import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { clsx } from 'clsx';
import './index.css';

export const ButtonGroup = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>((props, ref) => (
  <div
    {...props}
    ref={ref}
    className={clsx('graphiql-button-group', props.className)}
  />
));
ButtonGroup.displayName = 'ButtonGroup';
