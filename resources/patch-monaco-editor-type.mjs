import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve(
  './packages/monaco-graphql/esm/monaco-editor.d.ts',
);

const newContent = fs
  .readFileSync(filePath, 'utf8')
  .replace('/esm/vs/editor/edcore.main.js', '');

fs.writeFileSync(filePath, newContent);

console.log(
  `[patch-monaco-editor-type] Updated "${path.relative(process.cwd(), filePath)}"`,
);
