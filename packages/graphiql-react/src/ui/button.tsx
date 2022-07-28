import { compose } from '../utility/compose';

import './button.css';

export function UnStyledButton(props: JSX.IntrinsicElements['button']) {
  return (
    <button
      {...props}
      className={compose('graphiql-un-styled', props.className)}
    />
  );
}

type ButtonProps = { state?: 'success' | 'error' };

export function Button(props: ButtonProps & JSX.IntrinsicElements['button']) {
  return (
    <button
      {...props}
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
  );
}
