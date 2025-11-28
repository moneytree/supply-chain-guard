import { styleText } from 'node:util';
import { getAllowedPackagesByPath, isPackageExplicitlyAllowed } from './allowedPackages.js';
import { listParsers, getParserForManifest, getParserByName } from './manifestParsers/index.js';
import { getRegistryByName } from './registries/index.js';
import { limitedPromiseAll } from './util/promises.js';
import { gitLsFiles, gitFilesInDiff } from './util/git.js';
import { getLastModifiedTime } from './util/os.js';

const ONE_DAY = 24 * 3600 * 1000;

const findManifestsInRepo = async () => {
  // run `git ls-files` to find all manifest files tracked by git
  // this automatically avoids folders mentioned in .gitignore, like node_modules, .git, etc.

  const fileNames = listParsers().flatMap((parser) => parser.manifestFiles);
  const fileNamesInSubFolders = fileNames.map((fileName) => `**/${fileName}`);

  return await gitLsFiles([...fileNames, ...fileNamesInSubFolders]);
};

const shouldScanManifest = async (logger, manifestPath, options, diffFiles, cutoffTime) => {
  // if options.diffAgainstBranch is set, diff against target branch changed files, and decide whether to scan this manifest file

  if (options.diffAgainstBranch) {
    // diff against target branch

    if (diffFiles.has(manifestPath)) {
      // in diff: scan it
      return true;
    }

    // not in diff: scan it if --force
    if (options.force) {
      logger.v(
        'Forcing check of manifest file despite it not being in diff against branch',
        styleText('cyan', options.diffAgainstBranch),
      );
      return true;
    }

    // not in diff, not --force: don't scan it
    logger.info(
      'Skipping manifest file as it is not in diff against branch',
      styleText('cyan', options.diffAgainstBranch),
    );
    return false;
  }

  // if the manifest file has been modified in the last maxReleaseDaysAgo days, scan it

  const manifestLastModifiedTime = await getLastModifiedTime(manifestPath);
  if (manifestLastModifiedTime < cutoffTime) {
    // not recently modified

    const daysAgo = Math.floor((Date.now() - manifestLastModifiedTime) / ONE_DAY);

    if (options.force) {
      logger.v(
        'Forcing check of manifest file despite it being last modified',
        styleText('yellow', String(daysAgo)),
        'days ago',
      );
      return true;
    }

    logger.info('Skipping manifest file as it was last modified', styleText('yellow', String(daysAgo)), 'days ago');
    return false;
  }

  // recently modified: scan it
  return true;
};

const getPackagesPerRegistry = async (logger, options, cutoffTime) => {
  const packagesPerRegistry = {};
  const stats = {
    skippedManifestCount: 0,
    includedManifestCount: 0,
  };

  const allManifests = await findManifestsInRepo();

  // if --diff is set, get the list of files in the diff so we know which manifests to scan

  let diffFiles;
  if (options.diffAgainstBranch) {
    logger.info('Getting list of files that differ from branch', styleText('cyan', options.diffAgainstBranch));
    diffFiles = new Set(await gitFilesInDiff(options.diffAgainstBranch));
  }

  // for each manifest, collect packages and group them by registry

  for (const manifestPath of allManifests) {
    const parserName = getParserForManifest(manifestPath);
    const parser = getParserByName(parserName);

    const parserLogger = logger.branchWithContext(parserName);
    const manifestLogger = parserLogger.branchWithContext(manifestPath);

    manifestLogger.info('Found manifest file:', styleText('cyan', manifestPath));

    if (!(await shouldScanManifest(manifestLogger, manifestPath, options, diffFiles, cutoffTime))) {
      stats.skippedManifestCount += 1;
      continue;
    }

    // parse the manifest to get a list of packages

    const packages = await parser.listPackages(manifestLogger, manifestPath);

    // collect packages and group them by registry

    for (const pkg of packages) {
      packagesPerRegistry[pkg.registry] ||= [];
      packagesPerRegistry[pkg.registry].push(pkg);
    }

    stats.includedManifestCount += 1;
  }

  return { packagesPerRegistry, stats };
};

const findBreaches = async (logger, options) => {
  const cutoffTime = Date.now() - options.maxReleaseDaysAgo * ONE_DAY;

  const allAllowedPackagesByPath = await getAllowedPackagesByPath(logger);
  const { packagesPerRegistry, stats: manifestStats } = await getPackagesPerRegistry(logger, options, cutoffTime);

  // for each registry, check the publish time of each package

  const stats = {
    breachingPackageCount: 0,
    scannedPackageCount: 0,
    skippedPackageCount: 0,
    ...manifestStats,
  };

  await Promise.all(
    Object.entries(packagesPerRegistry).map(async ([registryName, packages]) => {
      const registryLogger = logger.branchWithContext([registryName]);
      const registry = getRegistryByName(registryName);

      // apply concurrency per registry

      await limitedPromiseAll(
        options.concurrency,
        packages.map((pkg) => {
          // return an async function to be called by limitedPromiseAll, that checks the publish time of this package

          return async () => {
            const manifestLogger = registryLogger.branchWithContext([pkg.manifestPath]);

            try {
              // if a package@version is explicitly allowed, don't check its publish time

              if (isPackageExplicitlyAllowed(allAllowedPackagesByPath, pkg)) {
                stats.skippedPackageCount += 1;

                manifestLogger.v(
                  'Skipping explicitly allowed package:',
                  styleText('green', pkg.id),
                  'version',
                  styleText('cyan', pkg.version),
                );
                return;
              }

              // get the publish time of this package@version

              const publishTime = await registry.getPublishTime(manifestLogger, pkg);

              if (typeof publishTime !== 'number') {
                throw new Error(`Invalid publish time for ${pkg.id} version ${pkg.version}: ${publishTime}`);
              }

              stats.scannedPackageCount += 1;

              // if the package was published more recently than cutoffTime, it's a breach

              const daysAgo = Math.floor((Date.now() - publishTime) / ONE_DAY);

              if (publishTime > cutoffTime) {
                stats.breachingPackageCount += 1;

                manifestLogger.error(
                  styleText('red', pkg.id),
                  'version',
                  styleText('cyan', pkg.version),
                  'was published',
                  styleText('yellow', String(daysAgo)),
                  'days ago',
                );
              } else {
                manifestLogger.vv(
                  styleText('green', pkg.id),
                  'version',
                  styleText('cyan', pkg.version),
                  'was published',
                  styleText('yellow', String(daysAgo)),
                  'days ago',
                );
              }
            } catch (error) {
              manifestLogger.error(
                styleText('red', `Error checking publish time for ${pkg.id} version ${pkg.version}: ${error.message}`),
              );

              // rethrow to fail
              throw error;
            }
          };
        }),
      );
    }),
  );

  return stats;
};

export default findBreaches;
