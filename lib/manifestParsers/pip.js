import fs from 'node:fs/promises';
import { basename } from 'node:path';
import Package from '../Package.js';
import { createPackageFromUrl } from '../urlParsers/index.js';

export const manifestFiles = ['Pipfile.lock', 'poetry.lock', 'uv.lock', 'pdm.lock'];

const getRegistryFromSource = (source) => {
  if (source.name === 'pypi') {
    return 'pypi';
  }

  throw new Error(`Unsupported source.name: ${JSON.stringify(source)}`);
};

const listPackagesFromPipfileLockV6 = (logger, manifestPath, manifest) => {
  const packages = [];

  const sources = manifest._meta.sources || [];
  if (sources.length !== 1) {
    throw new Error(`Pipfile.lock with ${sources.length} sources not implemented yet`);
  }

  const registry = getRegistryFromSource(sources[0]);

  for (const section of ['default', 'develop']) {
    for (const [name, pkgInfo] of Object.entries(manifest[section] || {})) {
      // Case 1: The package is a Git repository, which is typically internal, and for which there is no package registry
      if (pkgInfo.git) {
        const url = new URL(pkgInfo.git);
        url.hash = pkgInfo.ref ? `#${pkgInfo.ref}` : '';
        packages.push(createPackageFromUrl(manifestPath, url));
      } else {
        // Case 2: The package is a PyPI package, with a version
        if (!pkgInfo.version) {
          throw new Error(`No version specified in Pipfile.lock for ${name}`);
        }

        // version is like "==1.2.3"
        const versionMatch = pkgInfo.version.match(/^[=<>!~]+\s*([a-zA-Z0-9_.\-]+)\s*$/);
        if (!versionMatch) {
          throw new Error(`Could not parse version in Pipfile.lock for ${name}: ${pkgInfo.version}`);
        }

        const version = versionMatch[1];

        packages.push(new Package(null, name, version, manifestPath, registry));
      }
    }
  }

  return packages;
};

const listPackagesFromPipfileLock = async (logger, manifestPath) => {
  const contents = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(contents);

  if (manifest._meta['pipfile-spec'] !== 6) {
    throw new Error(`Pipfile.lock spec version ${manifest._meta['pipfile-spec']} not implemented yet`);
  }

  return listPackagesFromPipfileLockV6(logger, manifestPath, manifest);
};

export const listPackages = async (logger, manifestPath) => {
  const fileName = basename(manifestPath);
  switch (fileName) {
    case 'Pipfile.lock':
      return await listPackagesFromPipfileLock(logger, manifestPath);
    case 'poetry.lock':
      throw new Error('poetry.lock parsing not implemented yet');
    case 'uv.lock':
      throw new Error('uv.lock parsing not implemented yet');
    case 'pdm.lock':
      throw new Error('pdm.lock parsing not implemented yet');
    default:
      throw new Error(`Unsupported manifest file: ${manifestPath}`);
  }
};
