# Python

```Python

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
