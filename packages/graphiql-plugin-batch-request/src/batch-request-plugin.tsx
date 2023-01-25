import { PlayIcon, Spinner, StopIcon, useEditorContext } from '@graphiql/react';
import { FetcherParams } from '@graphiql/toolkit';
import { GraphiQLBatchRequestProps, TabsWithOperations } from 'graphiql-batch-request';
import { GraphQLError, parse, print } from 'graphql';
import { Kind } from 'graphql/language';
import { useState } from 'react';
import CheckboxTree from 'react-checkbox-tree';

import "@fortawesome/fontawesome-free/css/all.css";
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import './graphiql-batch-request.d.ts';
import './index.css';

export function BatchRequestPlugin({
  url,
  useAllOperations = false
}: GraphiQLBatchRequestProps) {
  const { tabs, responseEditor } = useEditorContext({ nonNull: true });
  
  let parsingError = '';
  let tabsWithOperations: TabsWithOperations = {};
  try {
    tabsWithOperations = tabs
    .filter(tab => tab.query !== '' && tab.query !== null)
    .map(tab => {
      const document = parse(tab.query as string);
      return {
        id: tab.id,
        document,
        operations: document.definitions.filter(
          definition => definition.kind === Kind.OPERATION_DEFINITION
        ),
        variables: tab.variables && tab.variables.trim() !== '' 
          ? JSON.parse(tab.variables) : 
          undefined,
        headers: tab.headers && tab.headers.trim() !== '' 
          ? JSON.parse(tab.headers) : 
          undefined
      }
    })
    .reduce((acc, tabWithOperations) => {
      acc[tabWithOperations.id] = tabWithOperations;
      return acc;
    }, {} as any);
  } catch(e: unknown) {
    if (e instanceof GraphQLError || e instanceof SyntaxError) {
      parsingError = e.message;
    }
  }

  const operationValues: string[] = [];
  const nodes = Object.values(tabsWithOperations).map(
    (tabWithOperations, i) => ({
      value: tabWithOperations.id,
      label: `Tab ${i + 1}`,
      children: tabWithOperations.operations.map((operation, j) => {
        const operationValue = operation.name?.value 
          ? `${tabWithOperations.id}|${operation.name.value}` 
          : `${tabWithOperations.id}|${j}`;
        operationValues.push(operationValue);

        return {
          value: operationValue,
          label: operation.name?.value ?? 'Unnamed operation'
        }
      })
    })
  );

  const [batchResponseLoading, setBatchResponseLoading] = useState(false);
  const [executeButtonDisabled, setExecuteButtonDisabled] = useState(
    useAllOperations === false
  );
  const [selectedOperations, setSelectedOperations] = useState(
    useAllOperations ? operationValues : []
  );
  const [expandedOperations, setExpandedOperations] = useState(
    Object.keys(tabsWithOperations)
  );
  

  if (parsingError !== '') {
    return (
      <>
        <p>Error parsing queries, verify your queries syntax in the tabs:</p>
        <p>{parsingError}</p>
      </>
    )
  }

  const sendBatchRequest = () => {
    const operations: FetcherParams[] = [];
    let headers = {};
    for (const selectedOperation of selectedOperations) {
      const [tabId, selectedOperationName] = selectedOperation.split('|');
      const tab = tabsWithOperations[tabId]
      if (tab) {
        const selectedOperationDefinition = tab.operations.find(
          (operation, i) => 
            operation.name?.value === selectedOperationName || 
            `${tab.id}|${i}` ===  selectedOperation
        )
        if (selectedOperationDefinition) {
          headers = {...headers, ...tab.headers};
          operations.push({
            operationName: selectedOperationDefinition.name?.value,
            query: print(tab.document),
            variables: tab.variables
          })
        };
      }
    }
    
    setBatchResponseLoading(true);

    window.fetch(url, {
      method: 'POST',
      body: JSON.stringify(operations),
      headers: {
        'content-type': 'application/json',
        ...headers
      }
    }).then(response => response.json())
      .then(json => {
        setBatchResponseLoading(false);
        responseEditor?.setValue(JSON.stringify(json, null, 2))
      })
  };

  return (
    <section aria-label="Batch Request" className="graphiql-batch-request">
      <div className="graphiql-batch-request-header">
        <div className="graphiql-batch-request-header-content">
          <div className="graphiql-batch-request-title">Batch Request</div>
        </div>
        <div className="graphiql-batch-request-send">
          <button
            disabled={executeButtonDisabled}
            type="button"
            className='graphiql-execute-button'
            aria-label={`${batchResponseLoading ? 'Stop' : 'Execute'} query (Ctrl-Enter)`}
            onClick={() => {
              if (!batchResponseLoading) {
                sendBatchRequest();
              }
            }}
          >
            {batchResponseLoading ? <StopIcon /> : <PlayIcon />}
          </button>
        </div>
      </div>
      <div className="graphiql-batch-request-content">
        <div className="graphiql-batch-request-description">
          <p style={{
            'display': executeButtonDisabled ? 'block' : 'none'
          }}>
            A batch GraphQL request requires at least 1 operation.
          </p>
          <p style={{
            'display': executeButtonDisabled === false && selectedOperations.length > 0 ? 'block' : 'none'
          }}>
            You have selected {selectedOperations.length === 1 ? `${selectedOperations.length} operation.` : `${selectedOperations.length} operations.`}
          </p>
        </div>
        <CheckboxTree
          icons={{
            expandClose: <i className="fa-solid fa-angle-right" />,
            expandOpen: <i className="fa-solid fa-angle-down" />,
            parentClose: null,
            parentOpen: null,
            leaf: null
          }}
          nodes={nodes}
          checked={selectedOperations}
          expanded={expandedOperations}
          onCheck={checked => {
            setSelectedOperations(checked);
            setExecuteButtonDisabled(checked.length === 0);
          }}
          onExpand={setExpandedOperations}
          expandOnClick
        />
        { batchResponseLoading ? <Spinner/> : null }
      </div>
    </section>
  );
}