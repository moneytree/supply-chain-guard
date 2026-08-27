import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as parser from '../../../lib/manifestParsers/pip.js';
import Logger from '../../../lib/Logger.js';

describe('Parser: Pip', () => {
  describe('listPackages()', () => {
    const createFixturePath = (filename) => {
      return `${import.meta.dirname}/fixtures/${filename}`;
    };

    it('returns packages for a v6 Pipfile.lock', async () => {
      const promise = parser.listPackages(new Logger(), createFixturePath('pipfile-lock-v6/Pipfile.lock'));

      assert.ok(promise instanceof Promise, 'Expected a Promise to be returned');
      const packages = await promise;
      assert.ok(Array.isArray(packages), 'Expected an array of packages');
      assert.ok(packages.length > 0, 'Expected an array of >0 packages');
    });

    it('returns registry and GitHub packages from a v1 uv.lock', async () => {
      const manifestPath = createFixturePath('uv-lock-v1/uv.lock');
      const packages = await parser.listPackages(new Logger(), manifestPath);

      assert.deepEqual(
        packages.map(({ id, version, registry, manifestPath }) => ({ id, version, registry, manifestPath })),
        [
          {
            id: 'requests',
            version: '2.31.0',
            registry: 'pypi',
            manifestPath,
          },
          {
            id: 'moneytree/dummy-repo',
            version: 'commit:951e5895098e1531ef0fc5cd6db592eae499ea75',
            registry: 'githubRepositories',
            manifestPath,
          },
        ],
      );
    });

    it('rejects unsupported uv.lock schema versions', async () => {
      await assert.rejects(
        parser.listPackages(new Logger(), createFixturePath('uv-lock-v2/uv.lock')),
        /uv\.lock schema version 2 not implemented yet/,
      );
    });

    it('rejects uv.lock packages from unsupported registries', async () => {
      await assert.rejects(
        parser.listPackages(new Logger(), createFixturePath('uv-lock-custom-registry/uv.lock')),
        /Unsupported registry in uv\.lock for private-package/,
      );
    });
  });
});
