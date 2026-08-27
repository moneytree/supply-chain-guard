import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as parser from '../../lib/urlParsers/files.pythonhosted.org.js';
import Package from '../../lib/Package.js';

describe('URL Parser: files.pythonhosted.org', () => {
  describe('createPackageFromUrl()', () => {
    it('returns a Package for source distributions', () => {
      const cases = [
        {
          url: 'https://files.pythonhosted.org/packages/5f/56/example/annotated_doc-0.0.5.tar.gz',
          name: 'annotated-doc',
          version: '0.0.5',
        },
        {
          url: 'https://files.pythonhosted.org/packages/38/71/example/markdown-it-py-3.0.0.tar.gz',
          name: 'markdown-it-py',
          version: '3.0.0',
        },
      ];

      for (const { url: urlString, name, version } of cases) {
        const url = new URL(urlString);

        assert.ok(parser.isMatch(url), `Expected isMatch to return true for URL: ${urlString}`);

        const pkg = parser.createPackageFromUrl('my-manifest-path.txt', url);
        assert.ok(pkg instanceof Package, `Expected a Package to be returned for URL: ${urlString}`);
        assert.equal(pkg.scope, null);
        assert.equal(pkg.name, name);
        assert.equal(pkg.version, version);
        assert.equal(pkg.manifestPath, 'my-manifest-path.txt');
        assert.equal(pkg.registry, 'pypi');
      }
    });

    it('returns a Package for wheels', () => {
      const urlString = 'https://files.pythonhosted.org/packages/5f/56/example/annotated_doc-0.0.5-py3-none-any.whl';
      const url = new URL(urlString);

      assert.ok(parser.isMatch(url), `Expected isMatch to return true for URL: ${urlString}`);

      const pkg = parser.createPackageFromUrl('my-manifest-path.txt', url);
      assert.ok(pkg instanceof Package, `Expected a Package to be returned for URL: ${urlString}`);
      assert.equal(pkg.scope, null);
      assert.equal(pkg.name, 'annotated-doc');
      assert.equal(pkg.version, '0.0.5');
      assert.equal(pkg.manifestPath, 'my-manifest-path.txt');
      assert.equal(pkg.registry, 'pypi');
    });
  });
});
