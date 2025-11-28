import * as npm from './npm.js';
import * as pypi from './pypi.js';
import * as rubygems from './rubygems.js';
import * as githubPackages from './githubPackages.js';
import * as githubRepositories from './githubRepositories.js';

const registryMap = {
  npm,
  pypi,
  rubygems,
  githubPackages,
  githubRepositories,
};

export const registryExists = (name) => {
  return registryMap.hasOwnProperty(name);
};

export const getRegistryByName = (name) => {
  const registry = registryMap[name];

  if (!registry) {
    throw new Error(`Unknown registry: ${name}`);
  }

  return registry;
};

export const mapRegistries = () => {
  return { ...registryMap };
};
