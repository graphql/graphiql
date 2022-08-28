import { graphqlLanguage } from '../dist/index.js';
import { fileTests } from '@lezer/generator/dist/test';

import * as fs from 'fs';
import * as path from 'path';
import assert from 'assert';
const caseDir = path.dirname(__dirname);

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
      it(`${name}`, () => run(graphqlLanguage.parser));
    }
  });

  it('fails', () => assert.strictEqual(true, false));
}
