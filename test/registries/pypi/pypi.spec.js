import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as registry from '../../../lib/registries/pypi.js';
import Package from '../../../lib/Package.js';
import Logger from '../../../lib/Logger.js';

describe('Registry: PyPI', () => {
  describe('getPublishTime()', () => {
    it('returns a valid publish time for a known public package', async () => {
      const promise = registry.getPublishTime(
        new Logger(),
        new Package(null, 'requests', '2.31.0', 'my-manifest-path.txt', 'pypi'),
      );

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const publishTime = await promise;
      assert.ok(Number.isInteger(publishTime), 'Expected publish time to be an integer');
      assert.ok(publishTime > 0, 'Expected publish time to be a positive number');
    });
  });
});
