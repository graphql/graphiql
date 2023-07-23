import { describe, it } from 'vitest';
import { graphqlLanguage } from '../dist/index.js';
import { fileTests } from '@lezer/generator/dist/test';

import * as fs from 'node:fs';
import * as path from 'node:path';

// because of the babel transformations, __dirname is the package root (cm6-graphql)
const caseDir = path.resolve(path.dirname(__dirname), '__tests__');

describe('codemirror 6 language', () => {
  for (const file of fs.readdirSync(caseDir)) {
    if (!/\.txt$/.test(file)) {
      continue;
    }

    const describeName = /^[^.]*/.exec(file)![0];
    describe(`${describeName}`, () => {
      for (const { name, run } of fileTests(
        fs.readFileSync(path.join(caseDir, file), 'utf8'),
        file,
      )) {
        it(`${name}`, () => {
          try {
            run(graphqlLanguage.parser);
          } catch (err) {
            require('node:console').log(name, err);
            throw err;
          }
        });
      }
    });
  }
});
