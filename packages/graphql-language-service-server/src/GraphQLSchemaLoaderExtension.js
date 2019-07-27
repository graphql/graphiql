import {GraphQLSchema} from 'graphql';

export type GraphQLSchemaLoaderPackage = {
  init: (loaderArgs: any) => GraphQLSchemaLoader,
}

export type GraphQLSchemaLoader = {
  getSchema: () => Promise<?GraphQLSchema>,
}

export type GraphQLSchemaConfigData = {
  loaderPackage: string,
  loaderArgs: any,
}

export class GraphQLSchemaLoaderExtension {
  _raw: GraphQLSchemaConfigData;

  constructor(schemaConfig: GraphQLSchemaConfigData) {
      this.raw = schemaConfig;
  }

  getSchemaLoader(): GraphQLSchemaLoader {
    return require(this.raw.loaderPackage).init(this.raw.loaderArgs);
  }
}
