import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapParsers } from '../../lib/manifestParsers/index.js';

describe('All parsers', () => {
  it('follow the prescribed interface', () => {
    let count = 0;
    for (const [name, parser] of Object.entries(mapParsers())) {
      count += 1;
      assert.ok(Array.isArray(parser.manifestFiles), `parser.manifestFiles should be an array in parser ${name}`);
      assert.equal(
        typeof parser.listPackages,
        'function',
        `parser.listPackages should be a function in parser ${name}`,
      );
      assert.equal(
        parser.listPackages.length,
        2,
        `parser.listPackages should take exactly two arguments in parser ${name}`,
      );
    }
    assert.ok(count > 0, 'No parsers found');
  });
});
