import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { clsx } from 'clsx';
import './index.css';

type UnStyledButtonProps = ComponentPropsWithoutRef<'button'>;

export const UnStyledButton = forwardRef<
  HTMLButtonElement,
  UnStyledButtonProps
>((props, ref) => (
  <button
    {...props}
    ref={ref}
    className={clsx('graphiql-un-styled', props.className)}
  />
));
UnStyledButton.displayName = 'UnStyledButton';

interface ButtonProps extends UnStyledButtonProps {
  state?: 'success' | 'error';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => (
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
  ),
);
Button.displayName = 'Button';
