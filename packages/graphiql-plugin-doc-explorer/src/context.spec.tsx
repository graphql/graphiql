import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { type Mock } from 'vitest';
import { useGraphiQL as $useGraphiQL, useGraphiQLActions as $useGraphiQLActions } from '@graphiql/react';
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

describe('DocExplorerStore keyboard shortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the doc explorer on plain Cmd/Ctrl+K, without requiring Alt', async () => {
    const user = userEvent.setup();
    setup();

    await user.keyboard('{Meta>}{k}{/Meta}');

    expect(setVisiblePlugin).toHaveBeenCalledWith(DOC_EXPLORER_PLUGIN);
  });

  it('does not open the doc explorer for Alt+Cmd/Ctrl+K (old binding)', async () => {
    const user = userEvent.setup();
    setup();

    await user.keyboard('{Alt>}{Meta>}{k}{/Meta}{/Alt}');

    expect(setVisiblePlugin).not.toHaveBeenCalled();
  });

  it('focuses the search input after opening via Cmd/Ctrl+K', async () => {
    const user = userEvent.setup();
    setup();

    const searchInput = document.createElement('div');
    searchInput.className = 'graphiql-doc-explorer-search-input';
    const clickSpy = vi.fn();
    searchInput.addEventListener('click', clickSpy);
    document.body.append(searchInput);

    await user.keyboard('{Meta>}{k}{/Meta}');

    await vi.waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  it('prevents default so Monaco does not swallow the shortcut', () => {
    setup();

    const event = new KeyboardEvent('keydown', {
      code: 'KeyK',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(setVisiblePlugin).toHaveBeenCalledWith(DOC_EXPLORER_PLUGIN);
  });
});
