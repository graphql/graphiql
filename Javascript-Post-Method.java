fetch('https://api.kivaws.org/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: "{lend {loan (id: 1568001){id name}}}" }),
})
  .then(res => res.json())
  .then(res => console.log(res.data));
