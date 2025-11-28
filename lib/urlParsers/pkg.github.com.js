import Package from '../Package.js';

// pattern examples:
//   https://npm.pkg.github.com/download/@moneytree/eslint-config/1.5.0/1d4714834bc552f10a88d214f607c51765ae8b68

export const isMatch = (url) => {
  return url.protocol === 'https:' && url.hostname.endsWith('.pkg.github.com');
};

/**
 * @param {string} manifestPath
 * @param {URL} url
 * @returns Package
 */
export const createPackageFromUrl = (manifestPath, url) => {
  const m = url.pathname.match(/^\/download\/(?<scope>@[\w-]+)\/(?<package>[^/]+)\/(?<version>[^/]+)\/.+$/);
  if (!m) {
    // for us, but doesn't match expected pattern
    throw new Error(`Unrecognized ${url.hostname} path: ${url.href}`);
  }

  const packageType = url.hostname.split('.')[0]; // e.g. npm, maven, rubygems
  const version = `${packageType}:${m.groups.version}`; // e.g. npm:1.2.3

  const owner = m.groups.scope.replace(/^@/, '');

  return new Package(owner, m.groups.package, version, manifestPath, 'githubPackages');
};
