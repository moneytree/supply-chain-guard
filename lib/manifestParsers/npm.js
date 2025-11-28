import fs from 'node:fs/promises';
import { createPackageFromUrl } from '../urlParsers/index.js';
import Package from '../Package.js';

export const manifestFiles = ['package-lock.json'];

/**
 * Parses a package entry from package-lock.json and creates a Package instance from it.
 *
 * @param {Logger} logger The logger instance.
 * @param {string} manifestPath The path to the package-lock.json file.
 * @param {object} packageInfo The entry from package-lock.json: { "version": "...", "resolved": "..." }
 * @returns {Package|null} The parsed Package, or null if it's a local or bundled dependency.
 */
function parsePackageJson(logger, manifestPath, packageInfo) {
  // For local or bundled dependencies, the resolved field will be missing and inBundle may be true.
  if (!packageInfo.resolved || packageInfo.inBundle) {
    return null;
  }

  // URL types found in the wild:
  // - registry.npmjs.org
  // - npm.pkg.github.com
  // - git+ssh://

  const url = new URL(packageInfo.resolved);
  const pkg = createPackageFromUrl(manifestPath, url);
  if (!pkg) {
    throw new Error(`Unrecognized URL: ${packageInfo.resolved}`);
  }

  return pkg;
}

const listPackagesV1 = (logger, manifestPath, manifest) => {
  const packages = [];

  for (const packageInfo of Object.values(manifest.dependencies || {})) {
    const pkg = parsePackageJson(logger, manifestPath, packageInfo);
    if (pkg) {
      packages.push(pkg);
    }
  }

  return packages;
};

const listPackagesV2 = (logger, manifestPath, manifest) => {
  const packages = [];

  for (const packageInfo of Object.values(manifest.packages || {})) {
    const pkg = parsePackageJson(logger, manifestPath, packageInfo);
    if (pkg) {
      packages.push(pkg);
    }
  }

  return packages;
};

const listPackagesV3 = (logger, manifestPath, manifest) => {
  const packages = [];

  for (const packageInfo of Object.values(manifest.packages || {})) {
    const pkg = parsePackageJson(logger, manifestPath, packageInfo);
    if (pkg) {
      packages.push(pkg);
    }
  }

  return packages;
};

export const listPackages = async (logger, manifestPath) => {
  const contents = await fs.readFile(manifestPath, 'utf-8');

  const manifest = JSON.parse(contents);

  switch (manifest.lockfileVersion) {
    case 1:
      return listPackagesV1(logger, manifestPath, manifest);
    case 2:
      return listPackagesV2(logger, manifestPath, manifest);
    case 3:
      return listPackagesV3(logger, manifestPath, manifest);
    default:
      throw new Error(`Unsupported lockfileVersion: ${manifest.lockfileVersion}`);
  }
};
