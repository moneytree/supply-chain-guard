import * as npmJs from './registry.npmjs.org.js';
import * as pkgGitHubCom from './pkg.github.com.js';
import * as githubCom from './github.com.js';
import * as yarnpkg from './registry.yarnpkg.com.js';
import * as filesPythonhostedOrg from './files.pythonhosted.org.js';

const parserMap = {
  npmJs,
  pkgGitHubCom,
  githubCom,
  yarnpkg,
  filesPythonhostedOrg,
};

export const createPackageFromUrl = (manifestPath, url) => {
  for (const [parserName, parser] of Object.entries(parserMap)) {
    if (!parser.isMatch(url)) {
      continue;
    }

    const pkg = parser.createPackageFromUrl(manifestPath, url);
    if (pkg) {
      return pkg;
    }
  }

  throw new Error(`Could not create package from URL: ${url}`);
};

export const mapParsers = () => {
  return { ...parserMap };
};
