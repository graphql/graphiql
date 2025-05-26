import fs from 'fs';
import path from 'path';

const filePath = path.resolve(
  './packages/monaco-graphql/esm/monaco-editor.d.ts',
); // Adjust this path

const newContent = fs.readFileSync(filePath, 'utf8');

fs.writeFileSync(
  filePath,
  newContent.replace('/esm/vs/editor/edcore.main.js', ''),
  'utf8',
);

console.log(
  `[patch-monaco-editor-type] Updated "${path.relative(process.cwd(), filePath)}"`,
);
