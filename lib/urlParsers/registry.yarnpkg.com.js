import Package from '../Package.js';

// pattern examples:
//   https://registry.yarnpkg.com/@adobe/css-tools/-/css-tools-4.4.2.tgz#c836b1bd81e6d62cd6cdf3ee4948bcdce8ea79c8

export const isMatch = (url) => {
  return url.protocol === 'https:' && url.hostname === 'registry.yarnpkg.com';
};

/**
 *
 * @param {string} manifestPath
 * @param {URL} url
 * @returns Package
 */
export const createPackageFromUrl = (manifestPath, url) => {
  const m = url.pathname.match(
    /^\/(?:(?<scope>@[\w-]+)\/)?(?<package>[^/]+)\/\-\/\k<package>-(?<version>.+)\.tgz(#.+)?$/,
  );
  if (!m) {
    // for us, but doesn't match expected pattern
    throw new Error(`Unrecognized registry.yarnpkg.com path: ${url.href}`);
  }

  return new Package(
    m.groups.scope || null,
    m.groups.package,
    m.groups.version,
    manifestPath,
    'npm', // registry.yarnpkg.com is an alias for npm
  );
};
