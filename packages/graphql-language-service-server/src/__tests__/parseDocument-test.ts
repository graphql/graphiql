import { parseDocument } from '../parseDocument';

describe('parseDocument', () => {
  it('parseDocument finds queries in tagged templates', async () => {
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

    const contents = parseDocument(text, 'test.js');
    expect(contents[0].query).toEqual(`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    
    `);
  });

  it('parseDocument finds queries in tagged templates in leaf', async () => {
    const text = `
    import {gql} from 'react-apollo';
    import type {B} from 'B';
    import A from './A';
    
    const QUERY = gql\`
    query Test {
      test {
        \${A.fragments.test}
      }
    }
    \`
    
    export function Example(arg: string) {}`;

    const contents = parseDocument(text, 'test.js');
    expect(contents[0].query).toEqual(`
    query Test {
      test {
        __typename
      }
    }
    `);
  });

  it('parseDocument finds queries in tagged templates using typescript', async () => {
    const text = `
    import {gql} from 'react-apollo';
    import {B} from 'B';
    import A from './A';
    
    const QUERY: string = gql\`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    \${A.fragments.test}
    \`
    
    export function Example(arg: string) {}`;

    const contents = parseDocument(text, 'test.ts');
    expect(contents[0].query).toEqual(`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    
    `);
  });

  it('parseDocument finds queries in tagged templates using tsx', async () => {
    const text = `
    import {gql} from 'react-apollo';
    import {B} from 'B';
    import A from './A';
    
    const QUERY: string = gql\`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    \${A.fragments.test}
    \`
    
    export function Example(arg: string) {
      return <div>{QUERY}</div>
    }`;

    const contents = parseDocument(text, 'test.tsx');
    expect(contents[0].query).toEqual(`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    
    `);
  });

  it('parseDocument finds queries in multi-expression tagged templates using tsx', async () => {
    const text = `
    import {gql} from 'react-apollo';
    import {B} from 'B';
    import A from './A';
    const someValue = 'value'
    const QUERY: string = gql\`
    query Test {
      test {
        value
        $\{someValue}
        ...FragmentsComment
      }
      $\{someValue}
    }\`
    
    export function Example(arg: string) {
      return <div>{QUERY}</div>
    }`;

    const contents = parseDocument(text, 'test.tsx');

    expect(contents[0].query).toEqual(`
    query Test {
      test {
        value
        
        ...FragmentsComment
      }
      
    }`);
  });
  // TODO: why an extra line here?
  it('parseDocument finds queries in multi-expression tagged template with declarations with using tsx', async () => {
    const text = `
    import {gql} from 'react-apollo';
    import {B} from 'B';
    import A from './A';
    const someValue = 'value'
    type SomeType = { test: any }
    const QUERY: string = gql<SomeType>\`
    query Test {
      test {
        value
        $\{someValue}
        ...FragmentsComment
      }
      $\{someValue}
    }\`
    
    export function Example(arg: string) {
      return <div>{QUERY}</div>
    }`;

    const contents = parseDocument(text, 'test.tsx');
    expect(contents[0].query).toEqual(`
    query Test {
      test {
        value
        
        ...FragmentsComment
      }
      
    }`);
  });

  it('parseDocument finds queries in multi-expression template strings using tsx', async () => {
    const text = `
    import {gql} from 'react-apollo';
    import {B} from 'B';
    import A from './A';
    const someValue = 'value'
    const QUERY: string =
    /* GraphQL */
    \`
    query Test {
      test {
        value
        \${someValue}
        ...FragmentsComment
      }
    }
    \${A.fragments.test}
    \`
    
    export function Example(arg: string) {
      return <div>{QUERY}</div>
    }`;

    const contents = parseDocument(text, 'test.tsx');
    expect(contents[0].query).toEqual(`
    query Test {
      test {
        value
        
        ...FragmentsComment
      }
    }
    
    `);
  });

  it('parseDocument finds queries in call expressions with template literals', async () => {
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

    const contents = parseDocument(text, 'test.js');
    expect(contents[0].query).toEqual(`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    
    `);
  });

  it('parseDocument finds queries in #graphql-annotated templates', async () => {
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

    const contents = parseDocument(text, 'test.ts');
    expect(contents[0].query).toEqual(`#graphql
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    
    `);
  });

  it('parseDocument finds queries in /*GraphQL*/-annotated templates', async () => {
    const text = `
    import {gql} from 'react-apollo';
    import {B} from 'B';
    import A from './A';
    
    const QUERY: string = /* GraphQL */ \`
      query Test {
        test {
          value
          ...FragmentsComment
        }
      }
    \${A.fragments.test}
    \`
    
    export function Example(arg: string) {}`;

    const contents = parseDocument(text, 'test.ts');
    // please let me keep this whitespace prettier!
    expect(contents[0].query).toEqual(/* GraphQL */ `
      query Test {
        test {
          value
          ...FragmentsComment
        }
      }
    
    `);
  });

  it('parseDocument ignores non gql tagged templates', async () => {
    const text = `
    // @flow
    import randomThing from 'package';
    import type {B} from 'B';
    import A from './A';
    
    const QUERY = randomThing\`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    \${A.fragments.test}
    \`
    
    export function Example(arg: string) {}`;

    const contents = parseDocument(text, 'test.js');
    expect(contents.length).toEqual(0);
  });

  it('parseDocument ignores non gql call expressions with template literals', async () => {
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

    const contents = parseDocument(text, 'test.js');
    expect(contents.length).toEqual(0);
  });

  it('an unparsable JS/TS file does not throw and bring down the server', async () => {
    const text = `
    // @flow
    import type randomThing fro 'package';
    import type {B} from 'B';
    im port A from './A';
    
    con  QUERY = randomThing\`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    \${A.frag`;

    const contents = parseDocument(text, 'test.js');
    expect(contents.length).toEqual(0);
  });

  it('an empty file is ignored', async () => {
    const text = '';

    const contents = parseDocument(text, 'test.js');
    expect(contents.length).toEqual(0);
  });

  it('a whitespace only file with empty asts is ignored', async () => {
    const text = `
    
    `;

    const contents = parseDocument(text, 'test.js');
    expect(contents.length).toEqual(0);
  });

  it('an ignored file is ignored', async () => {
    const text = `
    something
    `;
    const contents = parseDocument(text, 'test.txt');
    expect(contents.length).toEqual(0);
  });
});
