import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { Tooltip, UnStyledButton } from '../ui';

import './button.css';

type ToolbarButtonProps = {
  label: string;
};

export const ToolbarButton = forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps & JSX.IntrinsicElements['button']
>(({ label, ...props }, ref) => {
  const [error, setError] = useState<Error | null>(null);
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
        onClick={event => {
          try {
            props.onClick?.(event);
            setError(null);
          } catch (err) {
            setError(
              err instanceof Error
                ? err
                : new Error(`Toolbar button click failed: ${err}`),
            );
          }
        }}
        aria-label={error ? error.message : label}
        aria-invalid={error ? 'true' : props['aria-invalid']}
      />
    </Tooltip>
  );
});
ToolbarButton.displayName = 'ToolbarButton';
