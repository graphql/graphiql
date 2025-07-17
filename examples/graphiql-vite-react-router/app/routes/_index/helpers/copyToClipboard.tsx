export async function copyToClipboard(contents: string): Promise<void> {
  await navigator.clipboard.writeText(contents);
}
