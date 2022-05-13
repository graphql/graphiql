/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { ExplorerContextProvider } from '@graphiql/react';

import { DocExplorer } from '../DocExplorer';
import { ExampleSchema } from './ExampleSchema';

function DocExplorerWithContext(
  props: React.ComponentProps<typeof DocExplorer>,
) {
  return (
    <ExplorerContextProvider>
      <DocExplorer {...props} />
    </ExplorerContextProvider>
  );
}

describe('DocExplorer', () => {
  it('renders spinner when no schema prop is present', () => {
    const { container } = render(<DocExplorerWithContext />);
    const spinner = container.querySelectorAll('.spinner-container');
    expect(spinner).toHaveLength(1);
  });
  it('renders with null schema', () => {
    const { container } = render(<DocExplorerWithContext schema={null} />);
    const error = container.querySelectorAll('.error-container');
    expect(error).toHaveLength(1);
    expect(error[0]).toHaveTextContent('No Schema Available');
  });
  it('renders with schema', () => {
    const { container } = render(
      <DocExplorerWithContext schema={ExampleSchema} />,
    );
    const error = container.querySelectorAll('.error-container');
    expect(error).toHaveLength(0);
    expect(container.querySelector('.doc-type-description')).toHaveTextContent(
      'GraphQL Schema for testing',
    );
  });
});
