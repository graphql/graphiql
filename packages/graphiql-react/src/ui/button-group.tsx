import './button-group.css';

export function ButtonGroup(props: JSX.IntrinsicElements['div']) {
  return (
    <div
      {...props}
      className={`graphiql-button-group ${props.className || ''}`.trim()}
    />
  );
}
