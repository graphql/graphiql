import { graphql } from 'graphql-tag';

const query1 = graphql`
fragment ExampleFragment on ExampleType {
  something
}
`

const query2 = graphql`
  query ExampleQuery {
    exampleField {
      ...ExampleFragment
    }
  }
`;
