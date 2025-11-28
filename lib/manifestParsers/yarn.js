import fs from 'node:fs/promises';
import { createPackageFromUrl } from '../urlParsers/index.js';

export const manifestFiles = ['yarn.lock'];

const listPackagesV1 = (logger, manifestPath, manifest) => {
  const lines = manifest.split('\n');
  const packages = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      continue; // skip empty lines and comments
    }

    // extract all "resolved"-field values, those are all we need
    // examples:
    // - resolved "git+ssh://git@github.com/moneytree/dummy-repo.git#9d3afac0241812068798324dd88b9ca74f281208"
    // - resolved "https://registry.yarnpkg.com/@adobe/css-tools/-/css-tools-4.4.2.tgz#c836b1bd81e6d62cd6cdf3ee4948bcdce8ea79c8"
    // - resolved "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001524.tgz"
    // - resolved "https://codeload.github.com/moneytree/dummy-repo/tar.gz/9d3afac0241812068798324dd88b9ca74f281208"

    if (trimmedLine.startsWith('resolved ')) {
      const m = trimmedLine.match(/^resolved ["'](.+)["']$/);
      if (!m) {
        throw new Error(`Could not parse resolved line: ${trimmedLine}`);
      }

      const resolved = m[1];
      const url = new URL(resolved);

      const pkg = createPackageFromUrl(manifestPath, url);
      if (!pkg) {
        throw new Error(`Unrecognized URL: ${resolved}`);
      }

      packages.push(pkg);
    }
  }

  return packages;
};

export const listPackages = async (logger, manifestPath) => {
  const manifest = await fs.readFile(manifestPath, 'utf-8');

  if (manifest.includes('# yarn lockfile v1')) {
    return listPackagesV1(logger, manifestPath, manifest);
  }

  throw new Error('Unsupported yarn.lock format');
};
