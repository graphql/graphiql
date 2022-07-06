import './dropdown.css';

export function Dropdown(props: JSX.IntrinsicElements['ul']) {
  return (
    <ul
      {...props}
      className={`graphiql-dropdown ${props.className || ''}`.trim()}
    />
  );
}

Dropdown.Item = DropdownItem;

function DropdownItem(props: JSX.IntrinsicElements['li']) {
  return (
    <li
      {...props}
      className={`graphiql-dropdown-item ${props.className || ''}`.trim()}
    />
  );
}
