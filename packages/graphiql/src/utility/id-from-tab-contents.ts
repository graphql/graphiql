export function idFromTabContents(params: {
  query: string | undefined;
  variables: string | undefined;
  headers: string | undefined;
}) {
  return [
    params.query ?? '',
    params.variables ?? '',
    params.headers ?? '',
  ].join('|');
}
