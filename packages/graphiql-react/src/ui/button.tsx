import './button.css';

export function UnstyledButton(props: JSX.IntrinsicElements['button']) {
  return (
    <button
      {...props}
      className={`graphiql-unstyled ${props.className || ''}`.trim()}
    />
  );
}
