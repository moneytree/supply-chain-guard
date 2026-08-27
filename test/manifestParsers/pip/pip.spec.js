import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as parser from '../../../lib/manifestParsers/pip.js';
import Logger from '../../../lib/Logger.js';

describe('Parser: Pip', () => {
  describe('listPackages()', () => {
    const createFixturePath = (filename) => {
      return `${import.meta.dirname}/fixtures/${filename}`;
    };

    const createTemporaryUvLock = async (t, fixturePath) => {
      const directory = await fs.mkdtemp(join(tmpdir(), 'supply-chain-guard-uv-'));
      t.after(() => fs.rm(directory, { recursive: true, force: true }));

      const manifestPath = join(directory, 'uv.lock');
      await fs.copyFile(createFixturePath(fixturePath), manifestPath);
      return manifestPath;
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

    it('rejects unsupported uv.lock schema versions', async (t) => {
      const manifestPath = await createTemporaryUvLock(t, 'uv-lock-v2/lockfile.fixture');
      await assert.rejects(
        parser.listPackages(new Logger(), manifestPath),
        /uv\.lock schema version 2 not implemented yet/,
      );
    });

    it('rejects uv.lock packages from unsupported registries', async (t) => {
      const manifestPath = await createTemporaryUvLock(t, 'uv-lock-custom-registry/lockfile.fixture');
      await assert.rejects(
        parser.listPackages(new Logger(), manifestPath),
        /Could not create package from URL: https:\/\/packages\.example\.com\/files\/private_package-1\.2\.3\.tar\.gz/,
      );
    });
  });
});
