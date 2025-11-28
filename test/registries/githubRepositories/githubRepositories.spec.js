import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as registry from '../../../lib/registries/githubRepositories.js';
import Package from '../../../lib/Package.js';
import Logger from '../../../lib/Logger.js';

describe('Registry: GitHub Repositories', () => {
  describe('getPublishTime()', () => {
    it('returns a valid publish time for a known public package using a commit hash', async () => {
      const promise = registry.getPublishTime(
        new Logger(),
        new Package(
          'apple',
          'swift-algorithms',
          'commit:f6919dfc309e7f1b56224378b11e28bab5bccc42',
          'my-manifest-path.txt',
          'githubRepositories',
        ),
      );

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const publishTime = await promise;
      assert.ok(Number.isInteger(publishTime), 'Expected publish time to be an integer');
      assert.ok(publishTime > 0, 'Expected publish time to be a positive number');
    });

    it('returns a valid publish time for a known public package using a tag', async () => {
      const promise = registry.getPublishTime(
        new Logger(),
        new Package('apple', 'swift-algorithms', 'tag:1.2.1', 'my-manifest-path.txt', 'githubRepositories'),
      );

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const publishTime = await promise;
      assert.ok(Number.isInteger(publishTime), 'Expected publish time to be an integer');
      assert.ok(publishTime > 0, 'Expected publish time to be a positive number');
    });
  });
});
