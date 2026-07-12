import { PenIcon } from '@graphiql/react';
import type { DocumentNode } from 'graphql';
import { type FC, useState } from 'react';
import { listFragments } from '../lib/document-mutator';

type FragmentSectionProps = {
  /** The current document; used to list existing named fragments. */
  doc: DocumentNode;
  /** The fragment currently being edited, highlighted in the list. */
  activeFragmentName?: string;
  /** Switch to editing a fragment's tree. */
  onFocusFragment?: (fragmentName: string) => void;
  /** Renames a fragment and every spread that references it. */
  onRenameFragment?: (oldName: string, newName: string) => void;
};

type FragmentItemProps = {
  name: string;
  active?: boolean;
  onFocus?: (fragmentName: string) => void;
  onRename?: (oldName: string, newName: string) => void;
};

const FragmentItem: FC<FragmentItemProps> = ({
  name,
  active = false,
  onFocus,
  onRename,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== name) {
      onRename?.(name, next);
    } else {
      setDraft(name);
    }
  }

  function cancel() {
    setEditing(false);
    setDraft(name);
  }

  if (editing) {
    return (
      <li className="graphiql-qb-fragment-item">
        <input
          className="graphiql-qb-fragment-rename"
          value={draft}
          autoFocus
          aria-label={`Rename fragment ${name}`}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              commit();
            } else if (e.key === 'Escape') {
              cancel();
            }
          }}
        />
      </li>
    );
  }

  return (
    <li
      className={`graphiql-qb-fragment-item${
        active ? ' graphiql-qb-fragment-item--active' : ''
      }`}
    >
      {onFocus ? (
        <button
          type="button"
          className="graphiql-qb-fragment-name graphiql-qb-fragment-name--button"
          aria-current={active ? 'true' : undefined}
          aria-label={`Edit fragment ${name}`}
          onClick={() => onFocus(name)}
        >
          {name}
        </button>
      ) : (
        <span className="graphiql-qb-fragment-name">{name}</span>
      )}
      {onRename && (
        <button
          type="button"
          className="graphiql-qb-fragment-rename-btn"
          aria-label={`Rename fragment ${name}`}
          onClick={() => {
            setDraft(name);
            setEditing(true);
          }}
        >
          <PenIcon />
        </button>
      )}
    </li>
  );
};

/**
 * Renders the fragment panel in the query builder sidebar.
 *
 * Lists every named fragment in the document and lets each one be renamed in
 * place (the definition and all its spreads update together). New fragments are
 * created from a field row's "Extract to fragment" action, not from here.
 */
export const FragmentSection: FC<FragmentSectionProps> = ({
  doc,
  activeFragmentName,
  onFocusFragment,
  onRenameFragment,
}) => {
  const fragments = listFragments(doc);

  return (
    <section className="graphiql-qb-fragment-section" aria-label="Fragments">
      <h3 className="graphiql-qb-fragment-heading">Fragments</h3>
      {fragments.length === 0 ? (
        <p className="graphiql-qb-fragment-empty">No fragments defined.</p>
      ) : (
        <ul className="graphiql-qb-fragment-list" role="list">
          {fragments.map(name => (
            <FragmentItem
              key={name}
              name={name}
              active={name === activeFragmentName}
              onFocus={onFocusFragment}
              onRename={onRenameFragment}
            />
          ))}
        </ul>
      )}
    </section>
  );
};
