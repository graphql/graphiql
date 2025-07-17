/**
 * @see https://web.dev/articles/base64-encoding
 */
export function encode(data: string): string {
  const binaryData = new TextEncoder().encode(data);
  const binaryString = String.fromCodePoint(...binaryData);
  return btoa(binaryString);
}
