import React from 'react'
import ReactDOM from 'react-dom'
import { GraphiQL } from './components/GraphiQL'

const defaultOptions = {
  containerId: 'root',
  url: 'http://localhost:8080'
}

const getFetcher = async (opts) => {
  const { default: fetch } = await import('isomorphic-fetch');
  const resultFn = async (graphQLParams) => {
    const result = await fetch(opts.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graphQLParams),
    })
    return result.json()
  }
  return resultFn
}

export default async function renderGraphiQL(options = {}) {
  const opts = { ...defaultOptions, ...options }
  if (!opts.fetcher) {
    opts.fetcher = await getFetcher(opts)
  }
  return ReactDOM.render(
    <GraphiQL {...opts} />,
    opts.containerEl || document.getElementById(opts.containerId)
  )
}
