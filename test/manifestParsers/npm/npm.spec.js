import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as parser from '../../../lib/manifestParsers/npm.js';
import Logger from '../../../lib/Logger.js';

describe('Parser: NPM', () => {
  describe('listPackages()', () => {
    const createFixturePath = (filename) => {
      return `${import.meta.dirname}/fixtures/${filename}`;
    };

    it('returns packages for a v1 package-lock.json', async () => {
      const promise = parser.listPackages(new Logger(), createFixturePath('package-lock-v1/package-lock.json'));

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const packages = await promise;
      assert.ok(Array.isArray(packages), 'Expected an array of packages');
      assert.ok(packages.length > 0, 'Expected an array of >0 packages');
    });

    it('returns packages for a v2 package-lock.json', async () => {
      const promise = parser.listPackages(new Logger(), createFixturePath('package-lock-v2/package-lock.json'));

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const packages = await promise;
      assert.ok(Array.isArray(packages), 'Expected an array of packages');
      assert.ok(packages.length > 0, 'Expected an array of >0 packages');
    });

    it('returns packages for a v3 package-lock.json', async () => {
      const promise = parser.listPackages(new Logger(), createFixturePath('package-lock-v3/package-lock.json'));

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const packages = await promise;
      assert.ok(Array.isArray(packages), 'Expected an array of packages');
      assert.ok(packages.length > 0, 'Expected an array of >0 packages');
    });

    it('returns packages for a v3 package-lock.json using workspaces and linked packages', async () => {
      const promise = parser.listPackages(new Logger(), createFixturePath('package-lock-v3-links/package-lock.json'));

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const packages = await promise;
      assert.ok(Array.isArray(packages), 'Expected an array of packages');
      assert.ok(packages.length > 0, 'Expected an array of >0 packages');
    });
  });
});
