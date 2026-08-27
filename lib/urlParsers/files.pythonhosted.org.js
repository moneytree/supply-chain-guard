import Package from '../Package.js';

// pattern examples:
//   https://files.pythonhosted.org/packages/5f/56/example/annotated_doc-0.0.5.tar.gz
//   https://files.pythonhosted.org/packages/5f/56/example/annotated_doc-0.0.5-py3-none-any.whl

export const isMatch = (url) => {
  return url.protocol === 'https:' && url.hostname === 'files.pythonhosted.org';
};

const normalizePackageName = (name) => {
  return name.toLowerCase().replace(/[-_.]+/g, '-');
};

/**
 *
 * @param {string} manifestPath
 * @param {URL} url
 * @returns Package
 */
export const createPackageFromUrl = (manifestPath, url) => {
  const fileName = decodeURIComponent(url.pathname.split('/').pop());
  // PyPI still serves legacy sdists with hyphens in the package segment, so
  // split greedily at the final numeric version boundary.
  const sourceDistribution = fileName.match(/^(?<package>[a-zA-Z0-9._-]+)-(?<version>\d[^/]*)\.(?:tar\.gz|zip)$/);
  const wheel = fileName.match(/^(?<package>[a-zA-Z0-9._]+)-(?<version>[^/-]+)(?:-[^/-]+)?-[^/-]+-[^/-]+-[^/-]+\.whl$/);
  const match = sourceDistribution || wheel;

  if (!match) {
    throw new Error(`Unrecognized files.pythonhosted.org path: ${url.href}`);
  }

  return new Package(null, normalizePackageName(match.groups.package), match.groups.version, manifestPath, 'pypi');
};
