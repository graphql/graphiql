<?php

$graphql = graphql([
    'query' => "{
  post(idType: SLUG, id: 2) {
    title
    content
    date
  }
}"
]);

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

?>
