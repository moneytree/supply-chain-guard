import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as parser from '../../../lib/manifestParsers/swiftpm.js';
import Logger from '../../../lib/Logger.js';

describe('Parser: Swift Package Manager', () => {
  describe('listPackages()', () => {
    const createFixturePath = (filename) => {
      return `${import.meta.dirname}/fixtures/${filename}`;
    };

    it('returns packages for a v3 Package.resolved', async () => {
      const promise = parser.listPackages(new Logger(), createFixturePath('package-resolved-v3/Package.resolved'));

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const packages = await promise;
      assert.ok(Array.isArray(packages), 'Expected an array of packages');
      assert.ok(packages.length > 0, 'Expected an array of >0 packages');
    });
  });
});
