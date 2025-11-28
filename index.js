#!/usr/bin/env node

import { styleText } from 'node:util';
import Logger from './lib/Logger.js';
import findBreaches from './lib/findBreaches.js';
import { parseArgv } from './lib/util/argv.js';

const EXIT_CODE_BREACHES_FOUND = 1;
const EXIT_CODE_UNEXPECTED_ERROR = 2;
const EXIT_CODE_ARGUMENT_ERROR = 3;

const getOptions = async () => {
  const options = {
    concurrency: 20, // number of concurrent network requests per registry
    maxReleaseDaysAgo: 10, // days
    verbosity: 0, // 0 = normal, 1 = verbose (-v), 2 = very verbose (-vv)
    force: false, // if true, also check packages from manifest files not recently modified
    diffAgainstBranch: null, // if set, only check manifest files that differ from this branch
  };

  const schema = {
    '--concurrency': {
      option: 'concurrency',
      coerce: (n) => parseInt(n, 10),
      hasValue: true,
      description: 'maximum number of concurrent network requests per registry',
    },
    '--max-release-days-ago': {
      option: 'maxReleaseDaysAgo',
      coerce: (n) => parseFloat(n),
      hasValue: true,
      description: 'maximum age of a package release still considered safe (in days)',
    },
    '--diff': {
      option: 'diffAgainstBranch',
      coerce: (s) => s,
      hasValue: true,
      description: 'only include manifest files that differ from this branch',
    },
    '--verbose': { option: 'verbosity', coerce: () => 1, hasValue: false, description: 'enable verbose logging' },
    '-v': '--verbose',
    '-vv': { option: 'verbosity', coerce: () => 2, hasValue: false, description: 'enable very verbose logging' },
    '--force': {
      option: 'force',
      coerce: () => true,
      hasValue: false,
      description: 'scan manifest files even if they have not changed in diff or within <--max-release-days-ago> days',
    },
    '-f': '--force',
    '--help': { option: null, coerce: () => {}, hasValue: false, description: 'show this help message' },
    '-h': '--help',
    '--version': { option: null, coerce: () => {}, hasValue: false, description: 'show version number' },
  };

  await parseArgv(EXIT_CODE_ARGUMENT_ERROR, options, schema);

  // additional validation

  if (isNaN(options.concurrency) || options.concurrency < 1) {
    console.error('--concurrency must be a positive integer');
    process.exit(EXIT_CODE_ARGUMENT_ERROR);
  }

  if (isNaN(options.maxReleaseDaysAgo) || options.maxReleaseDaysAgo <= 0) {
    console.error('--max-release-days-ago must be a positive number');
    process.exit(EXIT_CODE_ARGUMENT_ERROR);
  }

  return options;
};

const options = await getOptions();

Logger.setVerbosity(options.verbosity);

const logger = new Logger();

try {
  logger.v('Program options:', options);

  const stats = await findBreaches(logger, options);

  logger.info(
    styleText(
      'blue',
      `Checked a total of ${stats.scannedPackageCount} packages across ${stats.includedManifestCount} manifest files.`,
    ),
  );
  logger.info(
    styleText('yellow', ` - ${stats.skippedPackageCount} packages were skipped because they are explicitly allowed.`),
  );

  if (stats.breachingPackageCount > 0) {
    logger.info(
      styleText(
        ['red', 'bold'],
        ` - ${stats.breachingPackageCount} packages were published less than ${options.maxReleaseDaysAgo} days ago.`,
      ),
    );
  } else {
    logger.info(styleText('green', ` - No packages were published less than ${options.maxReleaseDaysAgo} days ago.`));
  }
  logger.info(
    styleText(
      'blue',
      `Scanned ${stats.includedManifestCount} manifest files, skipped ${stats.skippedManifestCount} manifest files.`,
    ),
  );

  if (stats.breachingPackageCount > 0) {
    process.exit(EXIT_CODE_BREACHES_FOUND);
  } else {
    process.exit(0);
  }
} catch (error) {
  logger.error(error);
  process.exit(EXIT_CODE_UNEXPECTED_ERROR);
}
