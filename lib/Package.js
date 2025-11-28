import { registryExists } from './registries/index.js';

export default class Package {
  /**
   * Represents a package
   *
   * @param {string|null} scope     The scope of the package, if any (e.g. @moneytree)
   * @param {string} name           The name of the package
   * @param {string} version        The version of the package
   * @param {string} manifestPath   The path to the manifest file where this package was found
   * @param {string} registry       Where the package is hosted (e.g. npm, rubygems, etc.)
   */
  constructor(scope, name, version, manifestPath, registry) {
    if (!name) {
      throw new Error('Package name is required');
    }

    if (!version) {
      throw new Error('Package version is required');
    }

    if (!manifestPath) {
      throw new Error('Manifest path is required');
    }

    if (!registryExists(registry)) {
      throw new Error(`Unknown registry: ${registry}`);
    }

    // id is a human readable *and* unique identifier for the package within the registry
    this.id = scope ? `${scope}/${name}` : name;
    this.scope = scope || null;
    this.name = name;
    this.version = version;
    this.manifestPath = manifestPath;
    this.registry = registry;
  }
}
