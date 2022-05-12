import { GraphQLError, GraphQLFormattedError } from 'graphql';

function stringify(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

const formatSingleError = (error: Error): Error => ({
  ...error,
  // Raise these details even if they're non-enumerable
  message: error.message,
  stack: error.stack,
});

type InputError = Error | GraphQLError | string;

function handleSingleError(
  error: InputError,
): GraphQLFormattedError | Error | string {
  if (error instanceof GraphQLError) {
    return error.toString();
  }
  if (error instanceof Error) {
    return formatSingleError(error);
  }
  return error;
}

type GenericError =
  | Error
  | readonly Error[]
  | string
  | readonly string[]
  | GraphQLError
  | readonly GraphQLError[];

export function formatError(error: GenericError): string {
  if (Array.isArray(error)) {
    return stringify({
      errors: error.map((e: InputError) => handleSingleError(e)),
    });
  }
  // @ts-ignore
  return stringify({ errors: handleSingleError(error) });
}

export function formatResult(result: any): string {
  return stringify(result);
}
