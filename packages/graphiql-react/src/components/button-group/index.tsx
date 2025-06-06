import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '../../utility';
import './index.css';

export const ButtonGroup = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>((props, ref) => (
  <div
    {...props}
    ref={ref}
    className={cn('graphiql-button-group', props.className)}
  />
));
ButtonGroup.displayName = 'ButtonGroup';
