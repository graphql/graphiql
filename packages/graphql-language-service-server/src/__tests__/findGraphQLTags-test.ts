/**
 *  Copyright (c) 2022 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */
import { tmpdir } from 'os';

import { findGraphQLTags as baseFindGraphQLTags } from '../findGraphQLTags';

jest.mock('../Logger');

import { Logger } from '../Logger';

describe('findGraphQLTags', () => {
  const logger = new Logger(tmpdir());
  const findGraphQLTags = (text: string, ext: string) =>
    baseFindGraphQLTags(text, ext, '', logger);

  it('finds queries in tagged templates', async () => {
    const text = `
// @flow
import {gql} from 'react-apollo';
import type {B} from 'B';
import A from './A';

const QUERY = gql\`
query Test {
    test {
    value
    ...FragmentsComment
    }
}
\${A.fragments.test}
\`

export function Example(arg: string) {}`;

    const contents = findGraphQLTags(text, '.js');
    expect(contents[0].template).toEqual(`
query Test {
    test {
    value
    ...FragmentsComment
    }
}
`);
  });

  it('finds queries in call expressions with template literals', async () => {
    const text = `
    // @flow
    import {gql} from 'react-apollo';
    import type {B} from 'B';
    import A from './A';
    
    const QUERY = gql(\`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    \${A.fragments.test}
    \`);
    
    export function Example(arg: string) {}`;

    const contents = findGraphQLTags(text, '.js');
    expect(contents[0].template).toEqual(`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    `);
  });

  it('finds queries in #graphql-annotated templates', async () => {
    const text = `
import {gql} from 'react-apollo';
import {B} from 'B';
import A from './A';

const QUERY: string = \`#graphql
query Test {
  test {
    value
    ...FragmentsComment
  }
}
\${A.fragments.test}
\`

export function Example(arg: string) {}`;

    const contents = findGraphQLTags(text, '.ts');
    expect(contents[0].template).toEqual(`#graphql
query Test {
  test {
    value
    ...FragmentsComment
  }
}
`);
  });

  it('ignores non gql tagged templates', async () => {
    const text = `
// @flow
import randomthing from 'package';
import type {B} from 'B';
import A from './A';

const QUERY = randomthing\`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
\${A.fragments.test}
\`

export function Example(arg: string) {}`;

    const contents = findGraphQLTags(text, '.js');
    expect(contents.length).toEqual(0);
  });

  it('ignores non gql call expressions with template literals', async () => {
    const text = `
// @flow
import randomthing from 'package';
import type {B} from 'B';
import A from './A';

const QUERY = randomthing(\`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
\${A.fragments.test}
\`);

export function Example(arg: string) {}`;

    const contents = findGraphQLTags(text, '.js');
    expect(contents.length).toEqual(0);
  });
});
