import React from 'react';
import renderer from 'react-test-renderer';
import Layout from '../Layout';
import Providers from './fixtures/Providers';

it('renders correctly', () => {
  const tree = renderer
    .create(
      <Providers>
        <Layout />
      </Providers>,
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
