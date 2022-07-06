import { useState } from 'react';

import { UnStyledButton } from '../ui';

import './button.css';

export function ToolbarButton(props: JSX.IntrinsicElements['button']) {
  const [error, setError] = useState<Error | null>(null);
  return (
    <UnStyledButton
      {...props}
      type="button"
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
}
