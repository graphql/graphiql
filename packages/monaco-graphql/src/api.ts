import * as languageFeatures from './languageFeatures';
import type { DocumentNode } from 'graphql';
import { SchemaResponse } from 'graphql-languageservice';

export class MonacoGraphQLApi {
  private worker: languageFeatures.WorkerAccessor;
  constructor({ accessor }: { accessor: languageFeatures.WorkerAccessor }) {
    this.worker = accessor;
  }

  async getSchema(): Promise<SchemaResponse> {
    const langWorker = await this.worker();
    return langWorker.getSchemaResponse();
  }
  async parse(graphqlString: string): Promise<DocumentNode> {
    const langWorker = await this.worker();
    return langWorker.doParse(graphqlString);
  }
}
