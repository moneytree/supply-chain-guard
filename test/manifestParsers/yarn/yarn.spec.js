import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as parser from '../../../lib/manifestParsers/yarn.js';
import Logger from '../../../lib/Logger.js';

describe('Parser: Yarn', () => {
  describe('listPackages()', () => {
    const createFixturePath = (filename) => {
      return `${import.meta.dirname}/fixtures/${filename}`;
    };

    it('returns packages for v1 yarn.lock', async () => {
      const promise = parser.listPackages(new Logger(), createFixturePath('yarn-lock-v1/yarn.lock'));

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const packages = await promise;
      assert.ok(Array.isArray(packages), 'Expected an array of packages');
      assert.ok(packages.length > 0, 'Expected an array of >0 packages');
    });

    it('returns an empty array for Yarn Modern lockfiles', async () => {
      // Just has the metadata and one dependency since we read the metadata and skip anyway
      const promise = parser.listPackages(new Logger(), createFixturePath('yarn-lock-modern/yarn.lock'));

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const packages = await promise;
      assert.ok(Array.isArray(packages), 'Expected an array');
      assert.ok(packages.length === 0, 'Expected an empty array of packages');
    });
  });
});
