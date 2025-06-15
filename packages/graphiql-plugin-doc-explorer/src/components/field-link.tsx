import { FC } from 'react';
import { DocExplorerFieldDef, useDocExplorerActions } from '../context';
import './field-link.css';

type FieldLinkProps = {
  /**
   * The field or argument that should be linked to.
   */
  field: DocExplorerFieldDef;
};

export const FieldLink: FC<FieldLinkProps> = ({ field }) => {
  const { push } = useDocExplorerActions();

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
