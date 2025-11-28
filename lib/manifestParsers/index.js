import { basename } from 'node:path';

import * as npm from './npm.js';
import * as yarn from './yarn.js';
import * as pip from './pip.js';
import * as bundler from './bundler.js';
import * as swiftpm from './swiftpm.js';

const parserMap = {
  npm,
  yarn,
  pip,
  bundler,
  swiftpm,
};

const manifestToParserMap = {};

// populate manifestToParserMap
for (const [parserName, parser] of Object.entries(parserMap)) {
  for (const fileName of parser.manifestFiles) {
    manifestToParserMap[fileName] = parserName;
  }
}

export const getParserForManifest = (manifestPath) => {
  const fileName = basename(manifestPath);

  const parserName = manifestToParserMap[fileName];

  if (!parserName) {
    throw new Error(`No parser found for manifest file: ${manifestPath}`);
  }

  return parserName;
};

export const parserExists = (name) => {
  return parserMap.hasOwnProperty(name);
};

export const getParserByName = (name) => {
  const parser = parserMap[name];

  if (!parser) {
    throw new Error(`Unknown parser: ${name}`);
  }

  return parser;
};

export const listParsers = () => {
  return Object.values(parserMap);
};

export const mapParsers = () => {
  return { ...parserMap };
};
