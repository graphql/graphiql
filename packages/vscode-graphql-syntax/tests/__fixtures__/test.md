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

# TODO: get tags inside of other code blocks working

```js
const var = 1;

graphql`
    query {
      something
    }
`
```

```TypeScript
const var: number = 1;

graphql`
    query {
        something
    }
`
```

# Python

```python
query = gql(
    """
    query getContinents {
      continents {
        code
        name
      }
    }
  """
)

query = gql('''
    query getContinents {
      continents {
        code
        name
      }
    }
'''
)

query = gql(
'''
    query getContinents {
      continents {
        code
        name
      }
    }
'''
)

'''#graphql
    query getContinents {
      continents {
        code
        name
      }
    }
'''

query = '''#graphql query getContinents {
    continents {
        code
        name
    }
}'''

"""#graphql
    query getContinents {
      continents {
        code
        name
      }
    }
"""

"""#graphql query getContinents {
    continents {
        code
        name
    }
}"""
```
