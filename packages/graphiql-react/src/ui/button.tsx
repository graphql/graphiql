import { forwardRef } from 'react';
import { clsx } from 'clsx';

import './button.css';

export const UnStyledButton = forwardRef<
  HTMLButtonElement,
  JSX.IntrinsicElements['button']
>((props, ref) => (
  <button
    {...props}
    ref={ref}
    className={clsx('graphiql-un-styled', props.className)}
  />
));
UnStyledButton.displayName = 'UnStyledButton';

type ButtonProps = { state?: 'success' | 'error' };

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps & JSX.IntrinsicElements['button']
>((props, ref) => (
  <button
    {...props}
    ref={ref}
    className={clsx(
      'graphiql-button',
      {
        success: 'graphiql-button-success',
        error: 'graphiql-button-error',
      }[props.state!],
      props.className,
    )}
  />
));
Button.displayName = 'Button';
