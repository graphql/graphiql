import { FC } from 'react';
import { ExplorerFieldDef, useExplorerContext } from '../context';
import './field-link.css';

type FieldLinkProps = {
  /**
   * The field or argument that should be linked to.
   */
  field: ExplorerFieldDef;
};

export const FieldLink: FC<FieldLinkProps> = ({ field }) => {
  const { push } = useExplorerContext({ nonNull: true });

  return (
    <a
      className="graphiql-doc-explorer-field-name"
      onClick={event => {
        event.preventDefault();
        push({ name: field.name, def: field });
      }}
      href="#"
    >
      {field.name}
    </a>
  );
};
