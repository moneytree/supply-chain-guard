import { fetchWithRetry } from '../util/fetch.js';

const packageCache = {};

export const getPublishTime = async (logger, pkg) => {
  const url = `https://rubygems.org/api/v1/versions/${pkg.name}.json`;

  let data = packageCache[pkg.id];
  if (!data) {
    const response = await fetchWithRetry(url);
    data = await response.json();
    packageCache[pkg.id] = data;
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No version data found for ${pkg.name} at ${url}`);
  }

  const versionData = data.find(
    (entry) => entry.number === pkg.version || `${entry.number}-${entry.platform}` === pkg.version,
  );
  if (!versionData) {
    throw new Error(`No data found for ${pkg.name} version ${pkg.version} at ${url}`);
  }

  const publishedAt = versionData.created_at;
  if (!publishedAt) {
    throw new Error(`No created_at found for ${pkg.name} version ${pkg.version} at ${url}`);
  }

  const publishTime = new Date(publishedAt).getTime();
  if (isNaN(publishTime)) {
    throw new Error(`Invalid created_at for ${pkg.name} version ${pkg.version} at ${url}: ${publishedAt}`);
  }

  return publishTime;
};
