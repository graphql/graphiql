import { expect } from 'chai';
import { describe, it } from 'mocha';
import { omitKeys } from '../omitKeys';

describe('Omit keys', () => {
  it('create new object base on old without given keys', () => {
    const results = omitKeys(
      {
        headers: {
          accept: 'application/json',
        },
      },
      'headers',
    );
    expect(results).to.deep.equal({});
  });
});
