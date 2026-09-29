import { CloseIcon, PenIcon } from '@graphiql/react';
import type { DocumentNode } from 'graphql';
import { type FC, useState } from 'react';
import { listFragmentInfos } from '../lib/document-mutator';

type FragmentSectionProps = {
  /** The current document; used to list existing named fragments. */
  doc: DocumentNode;
  /** The fragment currently being edited, highlighted in the list. */
  activeFragmentName?: string;
  /** Switch to editing a fragment's tree. */
  onFocusFragment?: (fragmentName: string) => void;
  /** Renames a fragment and every spread that references it. */
  onRenameFragment?: (oldName: string, newName: string) => void;
  /** Deletes a fragment, inlining its selections at every spread site. */
  onDeleteFragment?: (fragmentName: string) => void;
};

type FragmentItemProps = {
  name: string;
  typeName: string;
  active?: boolean;
  onFocus?: (fragmentName: string) => void;
  onRename?: (oldName: string, newName: string) => void;
  onDelete?: (fragmentName: string) => void;
};

const FragmentItem: FC<FragmentItemProps> = ({
  name,
  typeName,
  active = false,
  onFocus,
  onRename,
  onDelete,
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

  const label = (
    <>
      <span className="graphiql-qb-fragment-name">{name}</span>
      <span className="graphiql-qb-fragment-type">
        on <span className="graphiql-qb-fragment-type-name">{typeName}</span>
      </span>
    </>
  );

  return (
    <li
      className={`graphiql-qb-fragment-item${
        active ? ' graphiql-qb-fragment-item--active' : ''
      }`}
    >
      {onFocus ? (
        <button
          type="button"
          className="graphiql-qb-fragment-open graphiql-qb-fragment-open--button"
          aria-current={active ? 'true' : undefined}
          aria-label={`Edit fragment ${name}`}
          onClick={() => onFocus(name)}
        >
          {label}
        </button>
      ) : (
        <span className="graphiql-qb-fragment-open">{label}</span>
      )}
      {(onRename || onDelete) && (
        <span className="graphiql-qb-fragment-actions">
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
          {onDelete && (
            <button
              type="button"
              className="graphiql-qb-fragment-delete-btn"
              aria-label={`Delete fragment ${name}, inlining it where spread`}
              onClick={() => onDelete(name)}
            >
              <CloseIcon />
            </button>
          )}
        </span>
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
  onDeleteFragment,
}) => {
  const fragments = listFragmentInfos(doc);

  return (
    <section className="graphiql-qb-fragment-section" aria-label="Fragments">
      <h3 className="graphiql-qb-fragment-heading">Fragments</h3>
      {fragments.length === 0 ? (
        <p className="graphiql-qb-fragment-empty">No fragments defined.</p>
      ) : (
        <ul className="graphiql-qb-fragment-list" role="list">
          {fragments.map(({ name, typeName }) => (
            <FragmentItem
              key={name}
              name={name}
              typeName={typeName}
              active={name === activeFragmentName}
              onFocus={onFocusFragment}
              onRename={onRenameFragment}
              onDelete={onDeleteFragment}
            />
          ))}
        </ul>
      )}
    </section>
  );
};
