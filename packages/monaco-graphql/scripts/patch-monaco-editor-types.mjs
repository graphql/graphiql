import { writeFile } from 'node:fs/promises';

/*
 * Generated types for `esm/monaco-editor` are incorrect, patch them by putting
 * reexport of `monaco-editor`
 */

await writeFile('esm/monaco-editor.d.ts', "export * from 'monaco-editor'");

console.log('✅ `monaco-graphql` types patched!');
