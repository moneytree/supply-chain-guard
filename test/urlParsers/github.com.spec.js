import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as parser from '../../lib/urlParsers/github.com.js';
import Package from '../../lib/Package.js';

describe('URL Parser: github.com', () => {
  describe('createPackageFromUrl()', () => {
    it('returns a Package for known valid GitHub URLs', () => {
      const scope = 'apple';
      const name = 'swift-algorithms';
      const version = 'commit:f6919dfc309e7f1b56224378b11e28bab5bccc42';

      const urls = [
        'https://github.com/apple/swift-algorithms#f6919dfc309e7f1b56224378b11e28bab5bccc42',
        'https://github.com/apple/swift-algorithms.git#f6919dfc309e7f1b56224378b11e28bab5bccc42',
        'git+ssh://github.com/apple/swift-algorithms.git#f6919dfc309e7f1b56224378b11e28bab5bccc42',
        'https://codeload.github.com/apple/swift-algorithms/tar.gz/f6919dfc309e7f1b56224378b11e28bab5bccc42',
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
          'githubRepositories',
          `Expected registry to be "githubRepositories" for URL: ${urlString}`,
        );
      }
    });
  });
});
