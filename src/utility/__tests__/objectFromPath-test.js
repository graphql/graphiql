import { expect } from 'chai';
import { describe, it } from 'mocha';

import { objectFromPath } from '../objectFromPath';

describe('Object from path', () => {
  it('makes object from given path', () => {
    const results = objectFromPath('headers.content-type', 'application/json', {
      headers: {
        accept: 'application/json',
      },
    });
    expect(results).to.deep.equal({
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
    });
  });
});
