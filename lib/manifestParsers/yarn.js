import fs from 'node:fs/promises';
import { createPackageFromUrl } from '../urlParsers/index.js';

export const manifestFiles = ['yarn.lock'];

const getManifestSchemaVersion = (manifest) => {
  if (manifest.includes('# yarn lockfile v1')) {
    return 1;
  }

  const m = manifest.match(/^__metadata:\s*\n((?:\s+.*\n?)+)/m);
  if (m) {
    const metadata = m[1];
    const versionMatch = metadata.match(/^\s+version:\s*(\d+)\s*$/m);
    if (!versionMatch) {
      throw new Error('Could not find version field in yarn.lock metadata');
    }

    return parseInt(versionMatch[1], 10);
  }

  throw new Error('Could not determine yarn.lock version from manifest');
};

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

const listPackagesV9 = (logger, manifestPath, manifest) => {
  const lines = manifest.split('\n');
  const packages = [];

  const parseResolution = (resolution) => {
    // examples:
    // - resolution: "@babel/code-frame@npm:7.29.0"
    // - resolution: "mt-some-github-repo@https://github.com/moneytree/mt-some-github-repo.git#commit=dd0df140a0e5eb3f6384f11d7bae3decac9afae7"
    // - resolution: "mt-some-github-repo@git+ssh://git@github.com/moneytree/mt-some-github-repo.git#commit=dd0df140a0e5eb3f6384f11d7bae3decac9afae7"
    // - resolution: "fsevents@patch:fsevents@npm%3A2.3.2#optional!builtin<compat/fsevents>::version=2.3.2&hash=df0bf1"

    const m = resolution.match(/^(.+?)@([^:]+?):(.+)$/);
    if (!m) {
      throw new Error(`Could not parse resolution: ${resolution}`);
    }

    const [, name, protocol, locatorData] = m;

    let url;

    if (protocol === 'https' || protocol === 'git+ssh') {
      url = new URL(`${protocol}:${locatorData}`);
    } else if (protocol === 'npm') {
      if (name.startsWith('@')) {
        const m = name.match(/^(@.+?)\/(.+)$/);
        if (!m) {
          throw new Error(`Could not parse scoped package name: ${name}`);
        }

        const [, scope, subname] = m;
        url = new URL(`https://registry.npmjs.org/${scope}/${subname}/-/${subname}-${locatorData}.tgz`);
      } else {
        url = new URL(`https://registry.npmjs.org/${name}/-/${name}-${locatorData}.tgz`);
      }
    } else if (protocol === 'patch') {
      // this is a patch protocol, used for patching existing npm packages. The locatorData contains a nested resolution, which we need to parse to get the actual URL. Example:
      // resolution: "fsevents@patch:fsevents@npm%3A2.3.2#optional!builtin<compat/fsevents>::version=2.3.2&hash=df0bf1"
      // we strip off the hash and everything after it
      const subResolution = decodeURIComponent(locatorData).split('#')[0];
      url = parseResolution(subResolution);
    } else if (protocol === 'workspace') {
      // ignore the project directory itself
      return null;
    }

    if (!url) {
      throw new Error(`Unsupported protocol "${protocol}" in resolution: ${resolution}`);
    }

    return url;
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      continue; // skip empty lines and comments
    }

    // extract all "resolution"-field values, those are all we need
    if (trimmedLine.startsWith('resolution: ')) {
      const m = trimmedLine.match(/^resolution: ["'](.+)["']$/);
      if (!m) {
        throw new Error(`Could not parse resolution line: ${trimmedLine}`);
      }

      const url = parseResolution(m[1]);
      if (!url) {
        continue; // skip irrelevant resolutions (not errors)
      }

      const pkg = createPackageFromUrl(manifestPath, url);
      if (!pkg) {
        throw new Error(`Unrecognized URL: ${url}`);
      }

      packages.push(pkg);
    }
  }

  return packages;
};

export const listPackages = async (logger, manifestPath) => {
  const manifest = await fs.readFile(manifestPath, 'utf-8');

  const version = getManifestSchemaVersion(manifest);

  if (version === 1) {
    return listPackagesV1(logger, manifestPath, manifest);
  }

  if (version === 9) {
    return listPackagesV9(logger, manifestPath, manifest);
  }

  throw new Error('Unsupported yarn.lock format');
};
