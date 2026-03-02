curl \
  -X GET \
  -H "Content-Type: application/json" \
  --data '{ "query": "{lend {loan (id: 1568001){id name}}}"}' \
  'https://api.kivaws.org/graphql'
