<!-- these seem horribly regressed. please someone fix this grammar! -->

$query = <<<GRAPHQL
  query {
    site {
      name
    }
  }
GRAPHQL;

$gql = <<<QUERY
query {
    pokemon(name: "Pikachu") {
        id
        number
        name
        attacks {
            special {
                name
                type
                damage
            }
        }
    }
}
QUERY;


