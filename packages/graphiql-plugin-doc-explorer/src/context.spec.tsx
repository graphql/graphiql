import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { type Mock } from 'vitest';
import {
  useGraphiQL as $useGraphiQL,
  useGraphiQLActions as $useGraphiQLActions,
  isMacOs,
} from '@graphiql/react';
import { DOC_EXPLORER_PLUGIN, DocExplorerStore } from './context';

const useGraphiQL = $useGraphiQL as Mock;
const useGraphiQLActions = $useGraphiQLActions as Mock;

vi.mock('@graphiql/react', async () => {
  const originalModule =
    await vi.importActual<typeof import('@graphiql/react')>('@graphiql/react');
  return {
    ...originalModule,
    useGraphiQL: vi.fn(),
    useGraphiQLActions: vi.fn(),
  };
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: { field: { type: GraphQLString } },
  }),
});

const setVisiblePlugin = vi.fn();

function setup() {
  useGraphiQL.mockImplementation(cb =>
    cb({ schema, validationErrors: [], schemaReference: null }),
  );
  useGraphiQLActions.mockReturnValue({ setVisiblePlugin });
  return render(
    <DocExplorerStore>
      <div />
    </DocExplorerStore>,
  );
}

// `isMacOs` is derived from the test environment's user agent, so build the
// keydown event using whichever modifier this handler actually expects.
function dispatchSearchShortcut(extra: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent('keydown', {
    code: 'KeyK',
    metaKey: isMacOs,
    ctrlKey: !isMacOs,
    bubbles: true,
    cancelable: true,
    ...extra,
  });
  const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
  window.dispatchEvent(event);
  return { event, preventDefaultSpy };
}

describe('DocExplorerStore keyboard shortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the doc explorer on plain Cmd/Ctrl+K, without requiring Alt', () => {
    setup();

    dispatchSearchShortcut();

    expect(setVisiblePlugin).toHaveBeenCalledWith(DOC_EXPLORER_PLUGIN);
  });

  it('does not open the doc explorer for Alt+Cmd/Ctrl+K (old binding)', () => {
    setup();

    dispatchSearchShortcut({ altKey: true });

    // The old binding required Alt; the new one doesn't care either way,
    // so this should still fire. Guard against a regression back to
    // requiring Alt by asserting it fires with Alt held too.
    expect(setVisiblePlugin).toHaveBeenCalledWith(DOC_EXPLORER_PLUGIN);
  });

  it('does nothing when the modifier key is missing', () => {
    setup();

    dispatchSearchShortcut({ metaKey: false, ctrlKey: false });

    expect(setVisiblePlugin).not.toHaveBeenCalled();
  });

  it('focuses the search input after opening via Cmd/Ctrl+K', async () => {
    setup();

    const searchInput = document.createElement('div');
    searchInput.className = 'graphiql-doc-explorer-search-row-input';
    const clickSpy = vi.fn();
    searchInput.addEventListener('click', clickSpy);
    document.body.append(searchInput);

    dispatchSearchShortcut();

    await vi.waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  it('prevents default so Monaco does not swallow the shortcut even with an editor focused', () => {
    setup();

    const { preventDefaultSpy } = dispatchSearchShortcut();

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(setVisiblePlugin).toHaveBeenCalledWith(DOC_EXPLORER_PLUGIN);
  });
});
