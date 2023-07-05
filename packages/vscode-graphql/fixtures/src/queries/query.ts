// @ts-expect-error
import { graphql } from 'graphql-tag';

const query1 = graphql`
fragment ExampleFragment on ExampleType {
  something
}
`

const query2 = graphql`
  query ExampleQuery {
    exampleFiel {
      ...ExampleFragmen
    }
  }
`;
