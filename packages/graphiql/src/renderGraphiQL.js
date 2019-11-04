import React from 'react'
import ReactDOM from 'react-dom'
import { GraphiQL } from './components/GraphiQL'

const logger = console

const defaultOptions = {
  containerId: 'root',
  url: 'http://localhost:8080'
}

const getFetcher = async (opts) => {
  // only load isomorphic fetch if a fetcher is not provided
  const { default: fetch } = await import('isomorphic-fetch');
  if (!opts.containerEl || opts.containerId) {
    logger.warn('no containerEl or containerId provided, defaulting #root')
  }
  if (!opts.url || !opts.fetcher) {
    logger.warn('no url or custom fetcher provided, defaulting to POSTs against http://localhost:8080')
  }
  const resultFn = async (graphQLParams) => {
    const result = await fetch(opts.url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...opts.headers
        },
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
