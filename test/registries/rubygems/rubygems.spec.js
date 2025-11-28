import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as registry from '../../../lib/registries/rubygems.js';
import Package from '../../../lib/Package.js';
import Logger from '../../../lib/Logger.js';

describe('Registry: RubyGems', () => {
  describe('getPublishTime()', () => {
    it('returns a valid publish time for a known public package', async () => {
      const promise = registry.getPublishTime(
        new Logger(),
        new Package(null, 'rails', '6.1.4', 'my-manifest-path.txt', 'rubygems'),
      );

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const publishTime = await promise;
      assert.ok(Number.isInteger(publishTime), 'Expected publish time to be an integer');
      assert.ok(publishTime > 0, 'Expected publish time to be a positive number');
    });
  });
});
