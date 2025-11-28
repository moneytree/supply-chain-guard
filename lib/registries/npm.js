import { fetchWithRetry } from '../util/fetch.js';

const packageCache = {};

export const getPublishTime = async (logger, pkg) => {
  const scopedName = pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name;
  const url = `https://registry.npmjs.org/${scopedName}`;

  let data = packageCache[pkg.id];
  if (!data) {
    const response = await fetchWithRetry(url);
    data = await response.json();
    packageCache[pkg.id] = data;
  }

  const publishedAt = data.time && data.time[pkg.version];
  if (!publishedAt) {
    throw new Error(`No publish time found for ${pkg.id} version ${pkg.version} at ${url}`);
  }

  const publishTime = new Date(publishedAt).getTime();
  if (isNaN(publishTime)) {
    throw new Error(`Invalid publish time for ${pkg.id} version ${pkg.version} at ${url}: ${publishedAt}`);
  }

  return publishTime;
};
