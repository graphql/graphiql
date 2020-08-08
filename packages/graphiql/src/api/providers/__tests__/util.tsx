import * as React from 'react';
import { render, RenderResult, act } from '@testing-library/react';

export async function renderProvider(Provider, Context, props) {
  const tree = (
    <Provider {...props}>
      <Context.Consumer>
        {value => (
          <span data-testid="output">{JSON.stringify(value.state)}</span>
        )}
      </Context.Consumer>
    </Provider>
  );
  let provider;
  await act(async () => (provider = render(tree)));
  return provider;
}

export function getProviderData({ getByTestId }: RenderResult) {
  const JSONString = getByTestId('output').textContent;
  return JSONString && JSON.parse(JSONString);
}
