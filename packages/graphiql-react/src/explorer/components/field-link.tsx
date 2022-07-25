import { ExplorerFieldDef, useExplorerContext } from '../context';

import './field-link.css';

type FieldLinkProps = {
  field: ExplorerFieldDef;
};

export function FieldLink(props: FieldLinkProps) {
  const { push } = useExplorerContext({ nonNull: true });

  return (
    <a
      className="graphiql-doc-explorer-field-name"
      onClick={event => {
        event.preventDefault();
        push({ name: props.field.name, def: props.field });
      }}
      href="#">
      {props.field.name}
    </a>
  );
}
