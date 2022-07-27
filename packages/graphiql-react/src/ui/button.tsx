import './button.css';

export function UnStyledButton(props: JSX.IntrinsicElements['button']) {
  return (
    <button
      {...props}
      className={`graphiql-un-styled ${props.className || ''}`.trim()}
    />
  );
}

export function Button(props: JSX.IntrinsicElements['button']) {
  return (
    <button
      {...props}
      className={`graphiql-button ${props.className || ''}`.trim()}
    />
  );
}
