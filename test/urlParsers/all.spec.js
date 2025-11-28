import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapParsers } from '../../lib/urlParsers/index.js';

describe('All URL parsers', () => {
  it('follow the prescribed interface', () => {
    let count = 0;
    for (const [name, parser] of Object.entries(mapParsers())) {
      count += 1;

      assert.equal(typeof parser.isMatch, 'function', `parser.isMatch should be a function in URL parser ${name}`);
      assert.equal(parser.isMatch.length, 1, `parser.isMatch should take exactly one argument in URL parser ${name}`);

      assert.equal(
        typeof parser.createPackageFromUrl,
        'function',
        `parser.createPackageFromUrl should be a function in URL parser ${name}`,
      );
      assert.equal(
        parser.createPackageFromUrl.length,
        2,
        `parser.createPackageFromUrl should take exactly two arguments in URL parser ${name}`,
      );
    }

    assert.ok(count > 0, 'No URL parsers found');
  });
});
