import {
  GraphiQLPlugin, PlayIcon, Spinner,
  StopIcon, useEditorContext
} from '@graphiql/react';
import { FetcherParams } from '@graphiql/toolkit';
import { useMemo, useRef, useState } from 'react';
import { parse, print } from 'graphql';
import { Kind } from 'graphql/language';
import CheckboxTree from 'react-checkbox-tree';
import { GraphiQLBatchRequestProps, TabsWithOperations } from 'graphiql-batch-request';

import "@fortawesome/fontawesome-free/css/all.css";
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import './graphiql-batch-request.d.ts';
import './index.css';

function BatchRequestPlugin({
  url,
  useAllOperations = false
}: GraphiQLBatchRequestProps) {
  const { tabs, responseEditor } = useEditorContext({ nonNull: true });
  
  let parsingError = '';
  let tabsWithOperations: TabsWithOperations = {};
  try {
    tabsWithOperations = tabs
    .filter(tab => tab.query !== '' && tab.query !== null)
    .map(tab => ({
      id: tab.id,
      operations: parse(tab.query as string).definitions.filter(
        definition => definition.kind === Kind.OPERATION_DEFINITION
      ),
      variables: tab.variables && tab.variables.trim() !== '' 
        ? JSON.parse(tab.variables) : 
        undefined,
      headers: tab.headers && tab.headers.trim() !== '' 
        ? JSON.parse(tab.headers) : 
        undefined
    }))
    .reduce((acc, tabWithOperations) => {
      acc[tabWithOperations.id] = tabWithOperations;
      return acc;
    }, {} as any);
  } catch(e: any) {
    parsingError = e.message;
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
            query: print(selectedOperationDefinition),
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

export function useBatchRequestPlugin(props: GraphiQLBatchRequestProps) {
  const propsRef = useRef(props);
  propsRef.current = props;
  return useMemo<GraphiQLPlugin>(
    () => ({
      title: 'Batch Request',
      icon: () => (
        <svg viewBox="0 0 24 24">
          <path d="M13.1546 3.36026C12.4835 3.00999 11.5741 3.00459 10.8976 3.35396C8.30466 4.6931 5.95279 6.22853 3.89182 7.93154C3.57311 8.19489 3.34693 8.57758 3.35079 9.02802C3.35463 9.47662 3.58541 9.85419 3.90218 10.1132C5.94604 11.7844 8.29985 13.3212 10.8453 14.6497C11.5165 15 12.4258 15.0054 13.1023 14.656C15.6953 13.3169 18.0472 11.7815 20.1081 10.0785C20.4268 9.8151 20.653 9.43242 20.6492 8.98197C20.6453 8.53338 20.4145 8.1558 20.0978 7.89679C18.0539 6.22562 15.7001 4.6888 13.1546 3.36026ZM11.5859 4.68671C11.8256 4.56294 12.2193 4.56411 12.4606 4.69004C14.8899 5.95796 17.1283 7.41666 19.0675 8.99223C17.1167 10.5932 14.885 12.0471 12.414 13.3233C12.1744 13.4471 11.7807 13.4459 11.5394 13.32C9.11004 12.052 6.87163 10.5933 4.9324 9.01777C6.88321 7.41684 9.11496 5.96285 11.5859 4.68671Z" fill="currentColor"/>
          <path d="M21.197 12.698C21.4164 13.0494 21.3094 13.512 20.958 13.7314L14.8508 17.5443C14.022 18.0617 12.9938 18.3009 11.9999 18.301C11.006 18.301 9.9777 18.0619 9.14884 17.5446L3.10851 13.7749C2.75711 13.5556 2.65003 13.093 2.86934 12.7416C3.08864 12.3902 3.55128 12.2831 3.90268 12.5024L9.94301 16.2721C10.4872 16.6117 11.2264 16.801 11.9998 16.801C12.7732 16.8009 13.5124 16.6116 14.0564 16.2719L20.1636 12.459C20.515 12.2397 20.9776 12.3467 21.197 12.698Z" fill="currentColor"/>
          <path d="M21.197 16.4527C21.4164 16.804 21.3094 17.2667 20.9581 17.4861L15.6692 20.7889C14.6115 21.4494 13.2886 21.7602 11.9998 21.7602C10.7111 21.7603 9.38808 21.4497 8.3303 20.7894L3.10843 17.5296C2.75706 17.3102 2.65004 16.8476 2.86938 16.4962C3.08873 16.1448 3.55139 16.0378 3.90276 16.2572L9.12462 19.517C9.89764 19.9995 10.9316 20.2603 11.9998 20.2602C13.068 20.2602 14.1018 19.9993 14.8746 19.5167L20.1635 16.2138C20.5149 15.9944 20.9776 16.1013 21.197 16.4527Z" fill="currentColor"/>
        </svg>
      ),
      content: () => <BatchRequestPlugin {...propsRef.current} />,
    }),
    [],
  );
}