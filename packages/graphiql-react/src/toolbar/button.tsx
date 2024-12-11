import { forwardRef, MouseEventHandler, useState } from 'react';
import { clsx } from 'clsx';
import { Tooltip, UnStyledButton } from '../ui';

import './button.css';

type ToolbarButtonProps = {
  label: string;
};

export const ToolbarButton = forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps & JSX.IntrinsicElements['button']
>(({ label, onClick, ...props }, ref) => {
  const [error, setError] = useState<Error | null>(null);
  const handleClick: MouseEventHandler<HTMLButtonElement> = event => {
    try {
      // Optional chaining inside try-catch isn't supported yet by react-compiler
      if (onClick) {
        onClick(event);
      }
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error(`Toolbar button click failed: ${err}`),
      );
    }
  };

  return (
    <Tooltip label={label}>
      <UnStyledButton
        {...props}
        ref={ref}
        type="button"
        className={clsx(
          'graphiql-toolbar-button',
          error && 'error',
          props.className,
        )}
        onClick={handleClick}
        aria-label={error ? error.message : label}
        aria-invalid={error ? 'true' : props['aria-invalid']}
      />
    </Tooltip>
  );
});
ToolbarButton.displayName = 'ToolbarButton';
