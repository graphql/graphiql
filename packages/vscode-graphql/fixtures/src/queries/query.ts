const gql = (arg: TemplateStringsArray) => null;


gql`
fragment ExampleFragment on ExampleType {
  something
}
`

gql`
  query ExampleQuery {
    exampleField {
      ...ExampleFragment
    }
  }
`;
