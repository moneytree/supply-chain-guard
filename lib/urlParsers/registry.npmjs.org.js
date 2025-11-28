import Package from '../Package.js';

// pattern examples:
//   https://registry.npmjs.org/@types/react/-/react-19.1.13.tgz
//   https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz

export const isMatch = (url) => {
  return url.protocol === 'https:' && url.hostname === 'registry.npmjs.org';
};

/**
 *
 * @param {string} manifestPath
 * @param {URL} url
 * @returns Package
 */
export const createPackageFromUrl = (manifestPath, url) => {
  const m = url.pathname.match(/^\/(?:(?<scope>@[\w-]+)\/)?(?<package>[^/]+)\/\-\/\k<package>-(?<version>.+)\.tgz$/);
  if (!m) {
    // for us, but doesn't match expected pattern
    throw new Error(`Unrecognized registry.npmjs.org path: ${url.href}`);
  }

  return new Package(m.groups.scope || null, m.groups.package, m.groups.version, manifestPath, 'npm');
};
