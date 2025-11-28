import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as parser from '../../lib/urlParsers/pkg.github.com.js';
import Package from '../../lib/Package.js';

describe('URL Parser: pkg.github.com', () => {
  describe('createPackageFromUrl()', () => {
    it('returns a Package for known valid GitHub Packages URLs', () => {
      const scope = 'moneytree';
      const name = 'eslint-config';
      const version = 'npm:1.5.0';

      const urls = [
        'https://npm.pkg.github.com/download/@moneytree/eslint-config/1.5.0/1d4714834bc552f10a88d214f607c51765ae8b68',
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
        assert.equal(pkg.registry, 'githubPackages', `Expected registry to be "githubPackages" for URL: ${urlString}`);
      }
    });
  });
});
