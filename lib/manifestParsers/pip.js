import fs from 'node:fs/promises';
import { basename } from 'node:path';
import Package from '../Package.js';
import { createPackageFromUrl } from '../urlParsers/index.js';

export const manifestFiles = ['Pipfile.lock', 'poetry.lock', 'uv.lock', 'pdm.lock'];

const UV_LOCAL_SOURCE_TYPES = new Set(['directory', 'editable', 'path', 'virtual']);
const UV_TOML_BASIC_STRING = '"(?:\\\\.|[^"\\\\])*"';

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

const parseUvTomlString = (literal, context) => {
  try {
    return JSON.parse(literal);
  } catch (error) {
    throw new Error(`Could not parse TOML string for ${context}`, { cause: error });
  }
};

const getUvPackageStringField = (packageBlock, field, packageName = 'unknown package') => {
  // uv writes these top-level package fields as TOML basic strings. Match only
  // complete field lines so similarly named nested metadata cannot be selected.
  const match = packageBlock.match(new RegExp(`^${field}\\s*=\\s*(${UV_TOML_BASIC_STRING})\\s*$`, 'm'));
  if (!match) {
    throw new Error(`No ${field} specified in uv.lock for ${packageName}`);
  }

  return parseUvTomlString(match[1], `${field} in ${packageName}`);
};

const getUvPackageSource = (packageBlock, packageName) => {
  const match = packageBlock.match(/^source\s*=\s*\{\s*([a-z][a-z-]*)\s*=\s*("(?:\\.|[^"\\])*")\s*\}\s*$/m);
  if (!match) {
    throw new Error(`Could not parse source in uv.lock for ${packageName}`);
  }

  return {
    type: match[1],
    value: parseUvTomlString(match[2], `source in ${packageName}`),
  };
};

const getUvPackageDistributionUrl = (packageBlock, packageName) => {
  const match = packageBlock.match(
    new RegExp(
      `^(?:sdist\\s*=\\s*\\{|wheels\\s*=\\s*\\[\\s*\\{)\\s*url\\s*=\\s*(${UV_TOML_BASIC_STRING})(?:\\s*,|\\s*\\})`,
      'm',
    ),
  );
  if (!match) {
    throw new Error(`No distribution URL specified in uv.lock for ${packageName}`);
  }

  return parseUvTomlString(match[1], `distribution URL in ${packageName}`);
};

const parseUvPackage = (manifestPath, packageBlock) => {
  const [packageFields] = packageBlock.split(/^\s*\[/m, 1);
  const name = getUvPackageStringField(packageFields, 'name');
  const source = getUvPackageSource(packageFields, name);

  if (UV_LOCAL_SOURCE_TYPES.has(source.type)) {
    return null;
  }

  if (source.type === 'registry') {
    const distributionUrl = getUvPackageDistributionUrl(packageFields, name);
    return createPackageFromUrl(manifestPath, new URL(distributionUrl));
  }

  if (source.type === 'git' || source.type === 'url') {
    return createPackageFromUrl(manifestPath, new URL(source.value));
  }

  throw new Error(`Unsupported source type in uv.lock for ${name}: ${source.type}`);
};

const listPackagesFromUvLockV1 = (logger, manifestPath, manifest) => {
  const [, ...packageBlocks] = manifest.split(/^\[\[package\]\]\s*$/m);
  return packageBlocks.map((packageBlock) => parseUvPackage(manifestPath, packageBlock)).filter(Boolean);
};

const listPackagesFromUvLock = async (logger, manifestPath) => {
  const manifest = await fs.readFile(manifestPath, 'utf-8');
  const packageStart = manifest.search(/^\[\[package\]\]\s*$/m);
  const header = packageStart === -1 ? manifest : manifest.slice(0, packageStart);
  const versionMatch = header.match(/^version\s*=\s*(\d+)\s*$/m);

  if (!versionMatch) {
    throw new Error('Could not determine uv.lock schema version from manifest');
  }

  const version = parseInt(versionMatch[1], 10);
  if (version !== 1) {
    throw new Error(`uv.lock schema version ${version} not implemented yet`);
  }

  return listPackagesFromUvLockV1(logger, manifestPath, manifest);
};

export const listPackages = async (logger, manifestPath) => {
  const fileName = basename(manifestPath);
  switch (fileName) {
    case 'Pipfile.lock':
      return await listPackagesFromPipfileLock(logger, manifestPath);
    case 'poetry.lock':
      throw new Error('poetry.lock parsing not implemented yet');
    case 'uv.lock':
      return await listPackagesFromUvLock(logger, manifestPath);
    case 'pdm.lock':
      throw new Error('pdm.lock parsing not implemented yet');
    default:
      throw new Error(`Unsupported manifest file: ${manifestPath}`);
  }
};
