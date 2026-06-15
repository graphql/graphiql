import type { DocumentNode } from 'graphql';
import type { FC } from 'react';
import { listFragments } from '../lib/document-mutator';

type FragmentSectionProps = {
  /** The current document; used to list existing named fragments. */
  doc: DocumentNode;
  /**
   * Called when the user wants to create a new fragment from the current
   * selection. The caller is responsible for prompting for (or generating)
   * a fragment name and type condition, then calling `createFragmentFromSelection`.
   */
  onCreateFragment?: () => void;
};

/**
 * Renders the fragment panel in the query builder sidebar.
 *
 * Shows a list of named fragments already present in the document and an
 * affordance to extract a new one from the current field selection. Inline
 * fragments for union/interface spreads are handled separately.
 */
export const FragmentSection: FC<FragmentSectionProps> = ({
  doc,
  onCreateFragment,
}) => {
  const fragments = listFragments(doc);

  return (
    <section className="graphiql-qb-fragment-section" aria-label="Fragments">
      <h4 className="graphiql-qb-fragment-heading">Fragments</h4>
      {fragments.length === 0 ? (
        <p className="graphiql-qb-fragment-empty">No fragments defined.</p>
      ) : (
        <ul className="graphiql-qb-fragment-list" role="list">
          {fragments.map(name => (
            <li key={name} className="graphiql-qb-fragment-item">
              <span className="graphiql-qb-fragment-name">{name}</span>
            </li>
          ))}
        </ul>
      )}
      {onCreateFragment && (
        <button
          type="button"
          className="graphiql-qb-create-fragment-btn"
          onClick={onCreateFragment}
        >
          Create fragment from selection
        </button>
      )}
    </section>
  );
};
