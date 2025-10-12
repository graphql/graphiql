<?hh

$query = <<<GRAPHQL
  query {
    site {
      name
    }
  }
GRAPHQL;

$query = /** @lang GraphQL */ '
  query {
    site {
      name
    }
  }
';
