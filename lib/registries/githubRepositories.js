import { fetchGitHubAPIPaginated, fetchGitHubAPI } from '../util/fetch.js';

const parsePackageVersion = (version) => {
  // Example version formats:
  // - "tag:1.0.0"
  // - "commit:abc123"

  const [type, value] = version.split(':');

  if (type === 'tag') {
    return { tag: value, commit: null };
  }

  if (type === 'commit') {
    return { tag: null, commit: value };
  }

  throw new Error(`Unsupported version format: ${version}`);
};

const packageCache = {};

export const getPublishTime = async (logger, pkg) => {
  if (!pkg.scope) {
    throw new Error(`Package scope is required for GitHub Repositories: ${pkg.id} (${pkg.manifestPath})`);
  }

  const cacheKey = `${pkg.id}@${pkg.version}`;

  if (packageCache[cacheKey]) {
    return packageCache[cacheKey];
  }

  let { tag, commit } = parsePackageVersion(pkg.version);

  if (tag) {
    // translate the tag to a commit hash using paginated fetcher
    // spec: https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repository-tags
    // does not require authentication for public repos, but has a low rate limit

    const tagUrl = `https://api.github.com/repos/${pkg.scope}/${pkg.name}/tags`;

    const { data } = await fetchGitHubAPIPaginated(tagUrl, { tokenRequiredHint: false });

    const tagInfo = data.find((t) => t.name === tag);
    if (!tagInfo) {
      throw new Error(`Tag ${tag} not found in ${tagUrl} (searched ${data.length} tags)`);
    }

    commit = tagInfo.commit && tagInfo.commit.sha;
    if (!commit) {
      throw new Error(`No commit found for tag ${tag} in ${tagUrl}`);
    }
  }

  // get commit info, which includes commit date
  // spec: https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#get-a-commit
  // does not require authentication for public repos, but has a low rate limit

  const commitUrl = `https://api.github.com/repos/${pkg.scope}/${pkg.name}/commits/${commit}`;

  const { data } = await fetchGitHubAPI(commitUrl, { tokenRequiredHint: false });

  const publishedAt = data?.commit && (data.commit.author?.date || data.commit.committer?.date);
  if (!publishedAt) {
    throw new Error(`No commit date found for ${commitUrl}`);
  }

  const publishTime = new Date(publishedAt).getTime();
  if (isNaN(publishTime)) {
    throw new Error(`Invalid commit date ${commitUrl}: ${publishedAt}`);
  }

  packageCache[cacheKey] = publishTime;
  return publishTime;
};
