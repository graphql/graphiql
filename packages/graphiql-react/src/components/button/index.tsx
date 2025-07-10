import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '../../utility';
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
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => (
    <button
      {...props}
      ref={ref}
      className={cn(
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
