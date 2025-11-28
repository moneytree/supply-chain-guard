import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { registryExists } from './registries/index.js';
import { gitLsFiles } from './util/git.js';

const ALLOW_FILE_NAME = '.supply-chain-guard-allow.json';

/*
 * Reads all allow-files in the repository, and returns an object with allowed packages organized by path and registry.
 * The key is the path where the allow-file was found (or '.' for the root of the repository).
 * The value is an object with registry names as keys, and objects with package names as keys and allowed versions as values.
 * Example:
 * {
 *   "path/to/allow-file": {
 *     "npm": {
 *       "@scope/package-name": ["1.2.3", "2.3.4"],
 *       "@scope/package-name": "*",
 *       "@scope/*": "*"
 *     },
 *     "pypi": {
 *       "some-package": ["1.2.3"],
 *       "some-package": "*"
 *     },
 *     "rubygems": {
 *       "a-gem": ["1.2.3"],
 *       "a-gem": "*"
 *     },
 *     "githubRepositories": {
 *       "owner/repo": ["commit:723fa5a6c65812aec4a0d7cc432ee198883b6e00"],
 *       "owner/repo": "*",
 *       "owner/*": "*"
 *     },
 *     "githubPackages": "*"
 *   }
 * }
 */
export const getAllowedPackagesByPath = async (logger) => {
  const allowFiles = await gitLsFiles([ALLOW_FILE_NAME, `**/${ALLOW_FILE_NAME}`]);

  const result = {};

  for (const allowFile of allowFiles) {
    let count = 0;
    let hasWildcards = false;

    const content = JSON.parse(await fs.readFile(allowFile, 'utf8'));

    // check contents for correctness
    for (const [registryName, packages] of Object.entries(content)) {
      count += 1;

      if (!registryExists(registryName)) {
        throw new Error(`Unknown registry in ${allowFile}: ${registryName}`);
      }

      if (packages === '*') {
        hasWildcards = true;
      } else {
        if (typeof packages !== 'object' || Array.isArray(packages) || packages === null) {
          throw new Error(`Invalid packages object in ${allowFile} for registry ${registryName}`);
        }

        for (const [packageName, versions] of Object.entries(packages)) {
          if (typeof packageName !== 'string' || packageName.trim() === '') {
            throw new Error(`Invalid package name in ${allowFile} for registry ${registryName}`);
          }

          if (packageName.includes('*')) {
            hasWildcards = true;
          }

          if (versions === '*') {
            hasWildcards = true;
          } else {
            if (!Array.isArray(versions) || versions.length === 0) {
              throw new Error(
                `Invalid versions array in ${allowFile} for package ${packageName} in registry ${registryName}`,
              );
            }

            for (const version of versions) {
              if (typeof version !== 'string' || version.trim() === '') {
                throw new Error(
                  `Invalid version in ${allowFile} for package ${packageName} in registry ${registryName}`,
                );
              }
            }
          }
        }
      }
    }

    result[path.dirname(allowFile)] = content;

    if (hasWildcards) {
      logger.info(`Found ${count} explicitly allowed package(s) in ${allowFile} (contains wildcards)`);
    } else {
      logger.info(`Found ${count} explicitly allowed package(s) in ${allowFile}`);
    }
  }

  return result;
};

export const isPackageExplicitlyAllowed = (allowedPackagesByPath, pkg) => {
  // For each directory in the path to the manifest, check if this package is allowed.
  // If it is allowed in any of the directories, it is considered allowed.
  const dirs = pkg.manifestPath.split('/').slice(0, -1); // all but the last part (the manifest file itself)
  for (let i = dirs.length; i >= 0; i -= 1) {
    const dir = dirs.slice(0, i).join('/') || '.';

    const allowedPackages = allowedPackagesByPath[dir];
    if (!allowedPackages || !allowedPackages[pkg.registry]) {
      continue;
    }

    const registryAllowedPackages = allowedPackages[pkg.registry];

    // is the entire registry allowed?
    if (registryAllowedPackages === '*') {
      return true;
    }

    const versions =
      (!pkg.scope && registryAllowedPackages[pkg.name]) ||
      (pkg.scope && registryAllowedPackages[`${pkg.scope}/${pkg.name}`]) ||
      (pkg.scope && registryAllowedPackages[`${pkg.scope}/*`]) ||
      registryAllowedPackages['*'];

    if (!versions) {
      continue;
    }

    // are all versions of this package allowed?
    if (versions === '*') {
      return true;
    }

    // is this specific version of the package allowed?
    if (Array.isArray(versions) && versions.includes(pkg.version)) {
      return true;
    }
  }

  return false;
};
