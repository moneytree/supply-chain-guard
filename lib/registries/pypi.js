import { fetchWithRetry } from '../util/fetch.js';

const packageCache = {};

export const getPublishTime = async (logger, pkg) => {
  const url = `https://pypi.org/pypi/${pkg.name}/${pkg.version}/json`;

  const cacheKey = `${pkg.id}@${pkg.version}`;

  let latestPublishTime = packageCache[cacheKey];
  if (latestPublishTime) {
    return latestPublishTime;
  }

  const response = await fetchWithRetry(url);
  const data = await response.json();

  // find upload time of most recent artifact uploaded for this version
  if (!data || !data.urls || data.urls.length === 0) {
    throw new Error(`No uploaded package URLs found in metadata of ${pkg.name} version ${pkg.version} at ${url}`);
  }

  for (const fileInfo of data.urls) {
    const publishedAt = fileInfo.upload_time_iso_8601;
    if (!publishedAt) {
      throw new Error(
        `No upload_time_iso_8601 found for ${pkg.name} version ${pkg.version} in one of the files at ${url}`,
      );
    }

    const publishTime = new Date(publishedAt).getTime();
    if (isNaN(publishTime)) {
      throw new Error(`Invalid upload_time_iso_8601 for ${pkg.name} version ${pkg.version} at ${url}: ${publishedAt}`);
    }

    if (!latestPublishTime || publishTime > latestPublishTime) {
      latestPublishTime = publishTime;
    }
  }

  packageCache[cacheKey] = latestPublishTime;

  return latestPublishTime;
};
