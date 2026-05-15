import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { clsx as cn } from 'clsx';
import './index.css';

type UnStyledButtonProps = ComponentPropsWithoutRef<'button'>;

export const UnStyledButton = forwardRef<
  HTMLButtonElement,
  UnStyledButtonProps
>((props, ref) => (
  <button
    {...props}
    ref={ref}
    className={cn('graphiql-un-styled', props.className)}
  />
));
UnStyledButton.displayName = 'UnStyledButton';

interface ButtonProps extends UnStyledButtonProps {
  state?: 'success' | 'error';
  variant?: 'default' | 'primary';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => (
    <button
      {...props}
      ref={ref}
      className={cn(
        'graphiql-button',
        props.variant === 'primary' && 'graphiql-button-primary',
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
