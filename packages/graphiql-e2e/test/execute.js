export function createExecute({
  execute,
  experimentalExecuteIncrementally,
  version,
}) {
  if (parseInt(version, 10) < 17) {
    return execute;
  }
  return async (...args) => {
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
  };
}
