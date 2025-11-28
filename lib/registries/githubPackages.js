import { fetchGitHubAPIPaginated } from '../util/fetch.js';

const packageCache = {};

export const getPublishTime = async (logger, pkg) => {
  if (!pkg.scope) {
    throw new Error(`Package scope is required for GitHub Packages: ${pkg.id} (${pkg.manifestPath})`);
  }

  const cacheKey = `${pkg.id}@${pkg.version}`;
  if (packageCache[cacheKey]) {
    return packageCache[cacheKey];
  }

  // parse packageType and packageVersion from pkg.version (eg. npm:1.2.3 or container:sha256:abc123)
  const match = pkg.version.match(/^(.*?):(.*)$/);
  if (!match) {
    throw new Error(`Invalid package version for GitHub Packages: ${pkg.version} (${pkg.id})`);
  }

  const packageType = match[1];
  const packageVersion = match[2];

  // Get all package versions using the paginated fetcher
  // spec: https://docs.github.com/en/rest/packages/packages?apiVersion=2022-11-28#list-package-versions-for-a-package-owned-by-an-organization
  // requires the "read:packages" scope on the GITHUB_TOKEN

  const url = `https://api.github.com/orgs/${pkg.scope}/packages/${packageType}/${pkg.name}/versions`;
  const { data } = await fetchGitHubAPIPaginated(url, { tokenRequiredHint: true });

  const versionInfo = data.find((version) => version.name === packageVersion);
  if (!versionInfo) {
    throw new Error(`Version ${packageVersion} not found for ${url} (searched ${data.length} versions)`);
  }

  const publishedAt = versionInfo.created_at;
  if (!publishedAt) {
    throw new Error(`No created_at found for ${url}`);
  }

  const publishTime = new Date(publishedAt).getTime();
  if (isNaN(publishTime)) {
    throw new Error(`Invalid created_at for ${url}: ${publishedAt}`);
  }

  packageCache[cacheKey] = publishTime;
  return publishTime;
};
