import { copyToClipboard } from './helpers/copyToClipboard'
import { createFetcher } from './helpers/createFetcher'
import { encode } from './helpers/encode'
import { ToolbarButton, useOperationsEditorState, useVariablesEditorState } from '@graphiql/react'
import { GraphiQL } from 'graphiql'
import { JSX } from 'react'

export function App(): JSX.Element {
  return <GraphiQL
    dangerouslyAssumeSchemaIsValid
    defaultEditorToolsVisibility="variables"
    fetcher={createFetcher('https://graphql.earthdata.nasa.gov/api')}
    isHeadersEditorEnabled={false}
  >
    <GraphiQL.Logo>API Explorer</GraphiQL.Logo>
    <GraphiQL.Toolbar>
      {({ prettify, copy, merge }) => (
        <>
          {prettify}
          {copy}
          {merge}
          <Button />
        </>
      )}
    </GraphiQL.Toolbar>
  </GraphiQL>
}

const Button = () => {
  const [operations] = useOperationsEditorState()
  const [variables] = useVariablesEditorState()
  async function onShareExplorer(): Promise<void> {
    const shareableURL = new URL('/explorer', window.location.origin)
    if (operations) shareableURL.searchParams.set('query', encode(operations))
    if (variables) shareableURL.searchParams.set('variables', encode(variables))
    await copyToClipboard(shareableURL.toString())
  }

  return <ToolbarButton
    label="Share your Explorer query"
    onClick={onShareExplorer}
    style={{ textAlign: 'center' }}
    title="Share your Explorer query"
  >
    S
  </ToolbarButton>
}
