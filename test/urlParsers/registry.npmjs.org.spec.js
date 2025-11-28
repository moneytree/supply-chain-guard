import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as parser from '../../lib/urlParsers/registry.npmjs.org.js';
import Package from '../../lib/Package.js';

describe('URL Parser: registry.npmjs.org', () => {
  describe('createPackageFromUrl()', () => {
    it('returns a Package for scoped packages', () => {
      const scope = '@types';
      const name = 'react';
      const version = '19.1.13';

      const urlString = 'https://registry.npmjs.org/@types/react/-/react-19.1.13.tgz';
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
      assert.equal(pkg.registry, 'npm', `Expected registry to be "npm" for URL: ${urlString}`);
    });

    it('returns a Package for unscoped packages', () => {
      const scope = null;
      const name = 'lodash';
      const version = '4.17.21';

      const urlString = 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz';
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
      assert.equal(pkg.registry, 'npm', `Expected registry to be "npm" for URL: ${urlString}`);
    });

    it('handles packages with complex version strings', () => {
      const scope = '@babel';
      const name = 'core';
      const version = '7.22.0-beta.1';

      const urlString = 'https://registry.npmjs.org/@babel/core/-/core-7.22.0-beta.1.tgz';
      const url = new URL(urlString);

      const isMatch = parser.isMatch(url);
      assert.ok(isMatch, `Expected isMatch to return true for URL: ${urlString}`);

      const pkg = parser.createPackageFromUrl('my-manifest-path.txt', url);
      assert.equal(pkg.scope, scope, `Expected scope to be "${scope}"`);
      assert.equal(pkg.name, name, `Expected name to be "${name}"`);
      assert.equal(pkg.version, version, `Expected version to be "${version}"`);
    });
  });
});
