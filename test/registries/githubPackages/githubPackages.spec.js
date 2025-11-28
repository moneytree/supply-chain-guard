import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as registry from '../../../lib/registries/githubPackages.js';
import Package from '../../../lib/Package.js';
import Logger from '../../../lib/Logger.js';

describe('Registry: GitHub Packages', () => {
  describe('getPublishTime()', () => {
    it('returns a valid publish time for a known public package', async () => {
      const promise = registry.getPublishTime(
        new Logger(),
        new Package(
          'actions',
          'actions-runner',
          'container:sha256:db0dcae6d28559e54277755a33aba7d0665f255b3bd2a66cdc5e132712f155e0',
          'my-manifest-path.txt',
          'githubPackages',
        ),
      );

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const publishTime = await promise;
      assert.ok(Number.isInteger(publishTime), 'Expected publish time to be an integer');
      assert.ok(publishTime > 0, 'Expected publish time to be a positive number');
    });
  });
});
