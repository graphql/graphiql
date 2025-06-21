/**
 * Can't use `monaco-graphql/esm/monaco-editor` due error in esm.sh example:
 * Uncaught TypeError: Cannot read properties of undefined (reading 'jsonDefaults')
 */

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from 'monaco-editor';
