import * as languageFeatures from './languageFeatures';
export class MonacoGraphQLApi {
  private worker: languageFeatures.WorkerAccessor;
  constructor({ accessor }: { accessor: languageFeatures.WorkerAccessor }) {
    this.worker = accessor;
  }

  getSchema = async () => {
    const langWorker = await this.worker();
    return langWorker.getSchemaResponse();
  };
  parse = async (graphqlString: string) => {
    const langWorker = await this.worker();
    return langWorker.doParse(graphqlString);
  };
}
