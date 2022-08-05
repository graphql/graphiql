function stringify(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

function formatSingleError(error: Error): Error {
  return {
    ...error,
    // Raise these details even if they're non-enumerable
    message: error.message,
    stack: error.stack,
  };
}

function handleSingleError(error: unknown) {
  if (error instanceof Error) {
    return formatSingleError(error);
  }
  return error;
}

export function formatError(error: unknown): string {
  if (Array.isArray(error)) {
    return stringify({
      errors: error.map(e => handleSingleError(e)),
    });
  }
  return stringify({ errors: [handleSingleError(error)] });
}

export function formatResult(result: any): string {
  return stringify(result);
}
