import Package from '../Package.js';

// pattern examples:
//   git+ssh://git@github.com/moneytree/dummy-repo.git#9d3afac0241812068798324dd88b9ca74f281208
//   https://codeload.github.com/moneytree/dummy-repo/tar.gz/9d3afac0241812068798324dd88b9ca74f281208

export const isMatch = (url) => {
  if (url.hostname === 'codeload.github.com') {
    // codeload.github.com is a service provided by GitHub that allows users to download repositories as ZIP files.
    // It is often used to access the contents of a repository without needing to clone it using Git.
    return true;
  }

  if (url.hostname === 'github.com') {
    return true;
  }

  return false;
};

const createPackageFromPlainUrl = (manifestPath, url) => {
  // hostname: github.com

  if (!url.hash || url.hash.length < 2) {
    throw new Error(`Missing commit hash in github.com URL: ${url.href}`);
  }

  const m = url.pathname.match(/^\/(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/);
  if (!m) {
    // for us, but doesn't match expected pattern
    throw new Error(`Unrecognized github.com path: ${url.href}`);
  }

  const hash = url.hash.substring(1); // remove leading '#'

  return new Package(m.groups.owner, m.groups.repo, `commit:${hash}`, manifestPath, 'githubRepositories');
};

const createPackageFromCodeLoadUrl = (manifestPath, url) => {
  // hostname: codeload.github.com

  const m = url.pathname.match(/^\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/tar\.gz\/(?<hash>.+)$/);
  if (!m) {
    // for us, but doesn't match expected pattern
    throw new Error(`Unrecognized codeload.github.com path: ${url.href}`);
  }

  return new Package(m.groups.owner, m.groups.repo, `commit:${m.groups.hash}`, manifestPath, 'githubRepositories');
};

export const createPackageFromUrl = (manifestPath, url) => {
  if (url.hostname === 'github.com') {
    return createPackageFromPlainUrl(manifestPath, url);
  }

  if (url.hostname === 'codeload.github.com') {
    return createPackageFromCodeLoadUrl(manifestPath, url);
  }

  throw new Error(`Unrecognized GitHub URL: ${url.href}`);
};
