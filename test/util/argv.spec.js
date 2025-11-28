import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgv } from '../../lib/util/argv.js';

describe('parseArgv', () => {
  it('parses known arguments', () => {
    const options = {
      concurrency: 20,
      maxReleaseDaysAgo: 10,
      verbosity: 0,
    };

    const schema = {
      '--verbose': { option: 'verbosity', coerce: () => 1, hasValue: false },
      '--concurrency': { option: 'concurrency', coerce: (n) => parseInt(n, 10), hasValue: true },
      '--max-release-days-ago': { option: 'maxReleaseDaysAgo', coerce: (n) => parseFloat(n), hasValue: true },
    };

    const argv = ['node', 'script.js', '--verbose', '--concurrency', '3', '--max-release-days-ago=3'];

    parseArgv(1, options, schema, argv);

    assert.deepEqual(options, {
      concurrency: 3,
      maxReleaseDaysAgo: 3,
      verbosity: 1,
    });
  });
});
