import { forwardRef, useState } from 'react';

import { UnStyledButton } from '../ui';

import './button.css';

export const ToolbarButton = forwardRef<
  HTMLButtonElement,
  JSX.IntrinsicElements['button']
>((props, ref) => {
  const [error, setError] = useState<Error | null>(null);
  return (
    <UnStyledButton
      {...props}
      ref={ref}
      className={
        'graphiql-toolbar-button' +
        (error ? ' error' : '') +
        (props.className ? ' ' + props.className : '')
      }
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
      title={error ? error.message : props.title}
      aria-invalid={error ? 'true' : props['aria-invalid']}
    />
  );
});
ToolbarButton.displayName = 'ToolbarButton';
