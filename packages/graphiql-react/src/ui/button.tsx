import { forwardRef } from 'react';
import { compose } from '../utility/compose';

import './button.css';

export const UnStyledButton = forwardRef<
  HTMLButtonElement,
  JSX.IntrinsicElements['button']
>((props, ref) => (
  <button
    {...props}
    ref={ref}
    className={compose('graphiql-un-styled', props.className)}
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
    className={compose(
      'graphiql-button',
      props.state === 'success'
        ? 'graphiql-button-success'
        : props.state === 'error'
        ? 'graphiql-button-error'
        : '',
      props.className,
    )}
  />
));
Button.displayName = 'Button';
