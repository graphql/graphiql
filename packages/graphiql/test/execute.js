/* eslint-disable import-x/no-extraneous-dependencies */
import { execute, experimentalExecuteIncrementally, version } from 'graphql';

export const customExecute =
  parseInt(version, 10) > 16
    ? async (...args) => {
        const result = await experimentalExecuteIncrementally(...args);

        if (!('subsequentResults' in result)) {
          return result;
        }

        const { initialResult, subsequentResults } = result;
        if (typeof subsequentResults[Symbol.asyncIterator] !== 'function') {
          return result;
        }

        return (async function* () {
          yield initialResult;
          yield* subsequentResults;
        })();
      }
    : execute;
