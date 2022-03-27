/**
 * Very simple and quick way of extracting the operation title from a document string
 * (compared to parsing and traversing the whole AST).
 */
export function fuzzyExtractOperationTitle(str: string): string {
  const regex = /^(?!.*#).*(query|subscription|mutation)\s+([a-zA-Z0-9_]+)/;
  const match = regex.exec(str);

  return match?.[2] ?? '<untitled>';
}
