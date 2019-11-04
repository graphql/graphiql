import React from 'react'
import { render } from 'react-dom'
import GraphiQL from 'graphiql'
import 'graphiql/graphiql.css'

const App = () => (
  <GraphiQL
    style={{ height: '100vh' }}
    fetcher={async (graphQLParams) => {
      const data = await fetch('https://swapi.graph.cool', { 
        method: "POST", headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphQLParams),
        credentials: 'include', 
      })
      return data.json()
    }}
  />
)

render(<App />, document.getElementById("root"))

