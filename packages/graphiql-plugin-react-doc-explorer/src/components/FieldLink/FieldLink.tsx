// hooks
import { useDocExplorer } from '../../hooks';

// styles
import './FieldLink.css';

// types
import { ExplorerFieldDef } from '../../types';

type FieldLinkProps = {
  /**
   * The field or argument that should be linked to.
   */
  field: ExplorerFieldDef;
};

export function FieldLink(props: FieldLinkProps) {
  const { push } = useDocExplorer();

  return (
    <button
      className="graphiql-doc-explorer-field-name"
      onClick={event => {
        event.preventDefault();
        push({ name: props.field.name, def: props.field });
      }}
    >
      {props.field.name}
    </button>
  );
}
