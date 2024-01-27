/**
 *  Copyright (c) 2022 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { Position, Range } from 'graphql-language-service';
import { findGraphQLTags as baseFindGraphQLTags } from '../findGraphQLTags';

jest.mock('../Logger');

import { NoopLogger } from '../Logger';
import { SupportedExtensionsEnum } from '../constants';

describe('findGraphQLTags', () => {
  const logger = new NoopLogger();
  const findGraphQLTags = (text: string, ext: SupportedExtensionsEnum) =>
    baseFindGraphQLTags(text, ext, '', logger);

  it('returns empty for files without asts', () => {
    const text = '// just a comment';
    const contents = findGraphQLTags(text, '.js');
    expect(contents.length).toEqual(0);
  });

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

  it('finds queries in /* GraphQL */ prefixed templates', async () => {
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

  it('finds queries with nested graphql.experimental template tag expression', async () => {
    const text = 'const query = graphql.experimental` query {} `';

    const contents = findGraphQLTags(text, '.ts');
    expect(contents[0].template).toEqual(' query {} ');
  });

  it('finds queries with spec decorators', async () => {
    const text = `
    
      @a class A {}
      const query = graphql\` query {} \` 
    
    `;
    const contents = findGraphQLTags(text, '.ts');

    expect(contents[0].template).toEqual(' query {} ');
  });

  it('finds queries with es7 decorators', async () => {
    const text = `
   
    class C {
      state = {isLoading: true}
      @enumerable(false)
      method() {}
      @something
      onChange() {}
    }

    // 'legacy-decorators' does'nt like this this. thus why the modes are incompatible
    class MyClass1 extends Component {
      state = {isLoading: true}
      
      @something
      onChange() {}
      
      @something()
      handleSubmit() {}
    }
    
    @isTestable(true)
    class MyClass {}
    
    @Module({
      imports: [
        GraphQLModule.forRoot({
          debug: false,
          playground: false,
        }),
      ],
    })

    class A {}
    
@Decorator.a.b()
class Todo {}

@Decorator.d().e
class Todo2{}

    @a
   class AppModule {}
      const query = graphql\` query {} \` 
    `;
    const contents = findGraphQLTags(text, '.ts');

    expect(contents[0].template).toEqual(' query {} ');
  });

  it('finds queries with nested template tag expressions', async () => {
    const text = `export default {
  else: () => gql\` query {} \`
}`;

    const contents = findGraphQLTags(text, '.ts');
    expect(contents[0].template).toEqual(' query {} ');
  });

  it('finds queries with template tags inside call expressions', async () => {
    const text = `something({
  else: () => graphql\` query {} \`
})`;

    const contents = findGraphQLTags(text, '.ts');
    expect(contents[0].template).toEqual(' query {} ');
  });

  it('finds queries in tagged templates in Vue SFC using <script setup>', async () => {
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
    expect(contents[0].range.start.line).toEqual(2);
    expect(contents[0].range.end.line).toEqual(4);
  });

  it('finds queries in tagged templates in Vue SFC using <script setup> and template above', async () => {
    const text = `<template>
      <div/>
    </template>
<script setup lang="ts">
gql\`
query {id}
\`;
</script>
`;
    const contents = findGraphQLTags(text, '.vue');
    expect(contents[0].template).toEqual(`
query {id}`);
    expect(contents[0].range.start.line).toEqual(4);
    expect(contents[0].range.end.line).toEqual(6);
  });

  it('finds queries in tagged templates in Vue SFC using normal <script>', async () => {
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
    expect(contents[0].range.start.line).toEqual(2);
    expect(contents[0].range.end.line).toEqual(4);
  });

  it('finds queries in tagged templates in Vue SFC using normal <script> and template above', async () => {
    const text = `<template>
    <div/>
  </template>
<script lang="ts">
gql\`
query {id}
\`;
</script>
`;
    const contents = findGraphQLTags(text, '.vue');
    expect(contents[0].template).toEqual(`
query {id}`);
    expect(contents[0].range.start.line).toEqual(4);
    expect(contents[0].range.end.line).toEqual(6);
  });

  it('finds queries in tagged templates in Vue SFC using <script lang="tsx">', async () => {
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

  it('finds queries in tagged templates in Svelte using normal <script>', async () => {
    const text = `
    <script context="module">
    const query = graphql(\`
    query AllCharacters {
        characters {
            results {
                name
                id
                image
            }
        }
    }
\`)
    export async function load({fetch}) {
        return { 
            props: {
                _data: await fetch({
                    text: query
                })
              }
            }
        }
  
</script>
`;
    const contents = findGraphQLTags(text, '.svelte');
    expect(contents[0].template).toEqual(`
    query AllCharacters {
        characters {
            results {
                name
                id
                image
            }
        }
    }
`);

    expect(JSON.stringify(contents[0].range)).toEqual(
      JSON.stringify(new Range(new Position(2, 29), new Position(12, 0))),
    );
  });

  it('no crash in Svelte files without <script>', async () => {
    const text = '';

    const consoleErrorSpy = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    const contents = baseFindGraphQLTags(text, '.svelte', '', new NoopLogger());
    // We should have no contents
    expect(contents).toMatchObject([]);

    // Nothing should be logged as it's a managed error
    expect(consoleErrorSpy.mock.calls.length).toBe(0);

    consoleErrorSpy.mockRestore();
  });

  it('no crash in Svelte files with empty <script>', async () => {
    const text = '<script></script>';

    const consoleErrorSpy = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    const contents = baseFindGraphQLTags(text, '.svelte', '', new NoopLogger());
    // We should have no contents
    expect(contents).toMatchObject([]);

    // Nothing should be logged as it's a managed error
    expect(consoleErrorSpy.mock.calls.length).toBe(0);

    consoleErrorSpy.mockRestore();
  });

  it('no crash in Svelte files with empty <script> (typescript)', async () => {
    const text = '<script lang="ts"></script>';

    const consoleErrorSpy = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    const contents = baseFindGraphQLTags(text, '.svelte', '', new NoopLogger());
    // We should have no contents
    expect(contents).toMatchObject([]);

    // Nothing should be logged as it's a managed error
    expect(consoleErrorSpy.mock.calls.length).toBe(0);

    consoleErrorSpy.mockRestore();
  });

  it('finds multiple queries in a single file', async () => {
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
    expect(contents[0].template).toEqual(' query {} ');

    // and the second string, with correct positional information!
    expect(contents[1].range.start.line).toEqual(3);
    expect(contents[1].range.start.character).toEqual(22);
    expect(contents[1].range.end.line).toEqual(3);
    expect(contents[1].range.end.character).toEqual(38);
    expect(contents[1].template).toEqual('query myQuery {}');
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
  it('handles full svelte example', () => {
    const text = `
    <script>
    import { ApolloClient, gql } from '@apollo/client';
    import { setClient, getClient, query } from 'svelte-apollo';
    import { onMount } from 'svelte';
    let country;
    const QUERY = gql\`
        query GetCountryData {
            countries(namePrefix: "America") {
                edges {
                    node {
                        name
                        flagImageUri
                    }
                }
            }
        }
    \`;
    const client = new ApolloClient({
        uri: 'https://geodb-cities-graphql.p.rapidapi.com/',
    });
    setClient(client);
    onMount(async () => {
        const response = query(client, { query: QUERY });
        country = response.data;
    });
</script>
<div>
    {#if country}
        <h2>
            {country.name}
        </h2>
        <img src={country.flagImageUri} alt="Country Flag" />
    {:else}
        <p>loading...</p>
    {/if}
</div>
    `;
    const contents = findGraphQLTags(text, '.svelte');
    expect(contents.length).toEqual(1);
  });
  it('handles full astro example', () => {
    const text = `
    ---
    const gql = String.raw;
    const response = await fetch("https://swapi-graphql.netlify.app/.netlify/functions/index",
      {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          query: gql\`
            query getFilm ($id:ID!) {
              film(id: $id) {
                title
                releaseDate
              }
            }
          \`,
          variables: {
            id: "XM6MQ==",
          },
        }),
      });

    const json = await response.json();
    const { film } = json.data;
    ---
    <h1>Fetching information about Star Wars: A New Hope</h1>
    <h2>Title: {film.title}</h2>
    <p>Year: {film.releaseDate}</p>`;
    const contents = findGraphQLTags(text, '.astro');
    expect(contents.length).toEqual(1);
  });
});
