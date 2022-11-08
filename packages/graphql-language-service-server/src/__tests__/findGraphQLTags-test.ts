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

  it('finds queries in tagged templates', () => {
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

  it('finds queries in call expressions with template literals', () => {
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

  it('finds queries in #graphql-annotated templates', () => {
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

  it('finds queries in /* GraphQL */ prefixed templates', () => {
    const text = `
import {gql} from 'react-apollo';
import {B} from 'B';
import A from './A';


const QUERY: string = 
/* GraphQL */ 
\`
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
    expect(contents[0].template).toEqual(`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
`);
  });

  it('finds queries with nested graphql.experimental template tag expression', () => {
    const text = `const query = graphql.experimental\` query {} \``;

    const contents = findGraphQLTags(text, '.ts');
    expect(contents[0].template).toEqual(` query {} `);
  });

  it('finds queries with nested template tag expressions', () => {
    const text = `export default {
  else: () => gql\` query {} \`
}`;

    const contents = findGraphQLTags(text, '.ts');
    expect(contents[0].template).toEqual(` query {} `);
  });

  it('finds queries with template tags inside call expressions', () => {
    const text = `something({
  else: () => graphql\` query {} \`
})`;

    const contents = findGraphQLTags(text, '.ts');
    expect(contents[0].template).toEqual(` query {} `);
  });

  it('finds queries in tagged templates in Vue SFC using <script setup>', () => {
    const text = `
<script setup lang="ts">
gql\`
query {id}
\`;
</script>
`;
    const contents = findGraphQLTags(text, '.vue');
    expect(contents[0].template).toEqual(`
query {id}`);
  });

  it('finds queries in tagged templates in Vue SFC using normal <script>', () => {
    const text = `
<script lang="ts">
gql\`
query {id}
\`;
</script>
`;
    const contents = findGraphQLTags(text, '.vue');
    expect(contents[0].template).toEqual(`
query {id}`);
  });

  it('finds queries in tagged templates in Vue SFC using <script lang="tsx">', () => {
    const text = `
<script lang="tsx">
import { defineComponent } from 'vue';

gql\`
query {id}
\`;

export default defineComponent({
  setup() {
    return () => <div>Hello</div>
  }
});
</script>
`;

    const contents = findGraphQLTags(text, '.vue');
    expect(contents[0].template).toEqual(`
query {id}`);
  });

  it('finds queries in tagged templates in Svelte using normal <script>', () => {
    const text = `
<script>
gql\`
query {id}
\`;
</script>
`;
    const contents = findGraphQLTags(text, '.svelte');
    expect(contents[0].template).toEqual(`
query {id}`);
  });

  it('finds multiple queries in a single file', () => {
    const text = `something({
  else: () => gql\` query {} \`
})
const query = graphql\`query myQuery {}\``;

    const contents = findGraphQLTags(text, '.ts');

    expect(contents.length).toEqual(2);

    // let's double check that we're properly
    // extracting the positions of each embedded string
    expect(contents[0].range.start.line).toEqual(1);
    expect(contents[0].range.start.character).toEqual(18);
    expect(contents[0].range.end.line).toEqual(1);
    expect(contents[0].range.end.character).toEqual(28);
    expect(contents[0].template).toEqual(` query {} `);

    // and the second string, with correct positional information!
    expect(contents[1].range.start.line).toEqual(3);
    expect(contents[1].range.start.character).toEqual(22);
    expect(contents[1].range.end.line).toEqual(3);
    expect(contents[1].range.end.character).toEqual(38);
    expect(contents[1].template).toEqual(`query myQuery {}`);
  });

  it('ignores non gql tagged templates', () => {
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

  it('ignores non gql call expressions with template literals', () => {
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
