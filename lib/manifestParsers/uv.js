import fs from 'node:fs/promises';
import { createPackageFromUrl } from '../urlParsers/index.js';

export const manifestFiles = ['uv.lock'];

const LOCAL_SOURCE_TYPES = new Set(['directory', 'editable', 'path', 'virtual']);
const TOML_BASIC_STRING = '"(?:\\\\.|[^"\\\\])*"';

const parseTomlString = (literal, context) => {
  try {
    return JSON.parse(literal);
  } catch (error) {
    throw new Error(`Could not parse TOML string for ${context}`, { cause: error });
  }
};

const getPackageStringField = (packageBlock, field, packageName = 'unknown package') => {
  // uv writes these top-level package fields as TOML basic strings. Match only
  // complete field lines so similarly named nested metadata cannot be selected.
  const match = packageBlock.match(new RegExp(`^${field}\\s*=\\s*(${TOML_BASIC_STRING})\\s*$`, 'm'));
  if (!match) {
    throw new Error(`No ${field} specified in uv.lock for ${packageName}`);
  }

  return parseTomlString(match[1], `${field} in ${packageName}`);
};

const getPackageSource = (packageBlock, packageName) => {
  const match = packageBlock.match(/^source\s*=\s*\{\s*([a-z][a-z-]*)\s*=\s*("(?:\\.|[^"\\])*")\s*\}\s*$/m);
  if (!match) {
    throw new Error(`Could not parse source in uv.lock for ${packageName}`);
  }

  return {
    type: match[1],
    value: parseTomlString(match[2], `source in ${packageName}`),
  };
};

const getPackageDistributionUrl = (packageBlock, packageName) => {
  const match = packageBlock.match(
    new RegExp(
      `^(?:sdist\\s*=\\s*\\{|wheels\\s*=\\s*\\[\\s*\\{)\\s*url\\s*=\\s*(${TOML_BASIC_STRING})(?:\\s*,|\\s*\\})`,
      'm',
    ),
  );
  if (!match) {
    throw new Error(`No distribution URL specified in uv.lock for ${packageName}`);
  }

  return parseTomlString(match[1], `distribution URL in ${packageName}`);
};

const parsePackage = (manifestPath, packageBlock) => {
  const [packageFields] = packageBlock.split(/^\s*\[/m, 1);
  const name = getPackageStringField(packageFields, 'name');
  const source = getPackageSource(packageFields, name);

  if (LOCAL_SOURCE_TYPES.has(source.type)) {
    return null;
  }

  if (source.type === 'registry') {
    const distributionUrl = getPackageDistributionUrl(packageFields, name);
    return createPackageFromUrl(manifestPath, new URL(distributionUrl));
  }

  if (source.type === 'git' || source.type === 'url') {
    return createPackageFromUrl(manifestPath, new URL(source.value));
  }

  throw new Error(`Unsupported source type in uv.lock for ${name}: ${source.type}`);
};

const listPackagesV1 = (logger, manifestPath, manifest) => {
  const [, ...packageBlocks] = manifest.split(/^\[\[package\]\]\s*$/m);
  return packageBlocks.map((packageBlock) => parsePackage(manifestPath, packageBlock)).filter(Boolean);
};

export const listPackages = async (logger, manifestPath) => {
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

  return listPackagesV1(logger, manifestPath, manifest);
};
