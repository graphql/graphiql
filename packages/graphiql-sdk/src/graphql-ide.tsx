import * as React from 'react';
import { PluginProvider } from './api/providers/GraphiQLPluginProvider';
import { EditorsProvider } from './api/providers/GraphiQLEditorsProvider';
import { SchemaProvider } from './api/providers/GraphiQLSchemaProvider';
import { SessionProvider } from './api/providers/GraphiQLSessionProvider';


export type GraphiQLIdeProps = {
  preset?: 
  plugins?:
  config?:
}

const GraphQLIde: React.FC<GraphQLIdeProps> = props => {
  if (!props.fetcher && !props.uri) {
    throw Error(i18n.t('Errors:Fetcher or uri property are required'));
  }
  const fetcher = getFetcher(props);
  return (
    <PluginProvider>
      <I18nextProvider i18n={i18n}>
        <EditorsProvider>
          <SchemaProvider
            fetcher={fetcher}
            config={{ uri: props.uri, ...props.schemaConfig }}>
            <SessionProvider fetcher={fetcher} sessionId={0}>
              <GraphiQLInternals
                {...{
                  formatResult,
                  formatError,
                  ...props,
                }}>
                {props.children}
              </GraphiQLInternals>
            </SessionProvider>
          </SchemaProvider>
        </EditorsProvider>
      </I18nextProvider>
    </PluginProvider>
  );
};

export default GraphiQLIde;
