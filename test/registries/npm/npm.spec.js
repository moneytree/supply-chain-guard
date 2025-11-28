import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as registry from '../../../lib/registries/npm.js';
import Package from '../../../lib/Package.js';
import Logger from '../../../lib/Logger.js';

describe('Registry: NPM', () => {
  describe('getPublishTime()', () => {
    it('returns a valid publish time for a known public package', async () => {
      const promise = registry.getPublishTime(
        new Logger(),
        new Package(null, 'lodash', '4.17.21', 'my-manifest-path.txt', 'npm'),
      );

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const publishTime = await promise;
      assert.ok(Number.isInteger(publishTime), 'Expected publish time to be an integer');
      assert.ok(publishTime > 0, 'Expected publish time to be a positive number');
    });
  });
});
