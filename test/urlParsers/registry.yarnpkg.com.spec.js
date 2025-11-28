import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as parser from '../../lib/urlParsers/registry.yarnpkg.com.js';
import Package from '../../lib/Package.js';

describe('URL Parser: registry.yarnpkg.com', () => {
  describe('createPackageFromUrl()', () => {
    it('returns a Package for scoped packages', () => {
      const scope = '@vue';
      const name = 'compiler-core';
      const version = '3.3.0-beta.1';

      const urls = [
        'https://registry.yarnpkg.com/@vue/compiler-core/-/compiler-core-3.3.0-beta.1.tgz#somehash',
        'https://registry.yarnpkg.com/@vue/compiler-core/-/compiler-core-3.3.0-beta.1.tgz',
      ];

      for (const urlString of urls) {
        const url = new URL(urlString);

        const isMatch = parser.isMatch(url);
        assert.ok(isMatch, `Expected isMatch to return true for URL: ${urlString}`);

        const pkg = parser.createPackageFromUrl('my-manifest-path.txt', url);
        assert.ok(pkg instanceof Package, `Expected a Package to be returned for URL: ${urlString}`);
        assert.equal(pkg.scope, scope, `Expected scope to be "${scope}" for URL: ${urlString}`);
        assert.equal(pkg.name, name, `Expected name to be "${name}" for URL: ${urlString}`);
        assert.equal(pkg.version, version, `Expected version to be "${version}" for URL: ${urlString}`);
        assert.equal(
          pkg.manifestPath,
          'my-manifest-path.txt',
          `Expected manifestPath to be "my-manifest-path.txt" for URL: ${urlString}`,
        );
        assert.equal(
          pkg.registry,
          'npm', // registry.yarnpkg.com is an alias for npm
          `Expected registry to be "npm" for URL: ${urlString}`,
        );
      }
    });

    it('returns a Package for unscoped packages', () => {
      const scope = null;
      const name = 'lodash';
      const version = '4.17.21';

      const urls = [
        'https://registry.yarnpkg.com/lodash/-/lodash-4.17.21.tgz',
        'https://registry.yarnpkg.com/lodash/-/lodash-4.17.21.tgz#somehash',
      ];

      for (const urlString of urls) {
        const url = new URL(urlString);

        const isMatch = parser.isMatch(url);
        assert.ok(isMatch, `Expected isMatch to return true for URL: ${urlString}`);

        const pkg = parser.createPackageFromUrl('my-manifest-path.txt', url);
        assert.ok(pkg instanceof Package, `Expected a Package to be returned for URL: ${urlString}`);
        assert.equal(pkg.scope, scope, `Expected scope to be null for URL: ${urlString}`);
        assert.equal(pkg.name, name, `Expected name to be "${name}" for URL: ${urlString}`);
        assert.equal(pkg.version, version, `Expected version to be "${version}" for URL: ${urlString}`);
        assert.equal(
          pkg.manifestPath,
          'my-manifest-path.txt',
          `Expected manifestPath to be "my-manifest-path.txt" for URL: ${urlString}`,
        );
        assert.equal(
          pkg.registry,
          'npm', // registry.yarnpkg.com is an alias for npm
          `Expected registry to be "npm" for URL: ${urlString}`,
        );
      }
    });
  });
});
