import React from 'react';
import renderer from 'react-test-renderer';
import Nav from '../Nav';
import Providers from './fixtures/Providers';

it('renders correctly', () => {
  const tree = renderer
    .create(
      <Providers>
        <Nav />
      </Providers>,
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
