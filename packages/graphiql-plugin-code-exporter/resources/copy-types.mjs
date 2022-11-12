import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const base = path.resolve(path.dirname(__filename), '..');

fs.copyFileSync(
  path.resolve(base, 'src', 'graphiql-code-exporter.d.ts'),
  path.resolve(base, 'types', 'graphiql-code-exporter.d.ts'),
);
