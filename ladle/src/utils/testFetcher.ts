import { Fetcher } from '../../../packages/graphiql-toolkit';

// @ts-expect-error fake Fetcher
export const testFetcher: Fetcher = () => {};
