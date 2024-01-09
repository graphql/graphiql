# this is an MD file

It would be a shame if the word `graphql` accidentally triggered highlighting
Looks like it doesn't though! good

```graphql
query {
  something
}
```

```gql
# comment
query {
  something
}
```

```GraphQL
query {
    something @directive(first: "string")
}

type Example {
    something
}
```

```php
<?php
  $query = <<<GRAPHQL
    query {
      site {
        name
      }
    }
  GRAPHQL;
?>
```

```ruby
 it "Should delimit queries" do
    query3 = <<~'GRAPHQL'
    {
        datasets(q: { idEq: 3 }) { id, daylight }
    }
    GRAPHQL
end

```
