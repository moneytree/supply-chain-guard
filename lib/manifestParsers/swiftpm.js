import fs from 'node:fs/promises';
import Package from '../Package.js';

export const manifestFiles = ['Package.resolved'];

const parsePinV1 = (manifestPath, pin) => {
  /* Example pin:
  {
    "package": "Nimble",
    "repositoryURL": "https://github.com/Quick/Nimble",
    "state": {
      "branch": null,
      "revision": "af1730dde4e6c0d45bf01b99f8a41713ce536790",
      "version": "9.2.0"
    }
  }
  */

  if (!pin.repositoryURL) {
    throw new Error(`No repositoryURL found for package ${pin.package} in ${manifestPath}`);
  }

  if (pin.repositoryURL.startsWith('https://')) {
    const url = new URL(pin.repositoryURL);

    if (url.hostname === 'github.com') {
      if (!pin?.state?.revision) {
        throw new Error(`No revision found for ${pin.repositoryURL} in ${manifestPath}`);
      }

      const registry = 'githubRepositories';
      const parts = url.pathname.split('/').filter(Boolean);
      const owner = parts[0];
      const repo = parts[1].endsWith('.git') ? parts[1].slice(0, -4) : parts[1];
      const version = `commit:${pin.state.revision}`;

      return new Package(owner, repo, version, manifestPath, registry);
    }

    throw new Error(`Unsupported remote source: ${pin.repositoryURL} in ${manifestPath}`);
  }
};

const parsePinV2 = (manifestPath, pin) => {
  /* Example pin:
  {
    "identity" : "alamofire",
    "kind" : "remoteSourceControl",
    "location" : "https://github.com/Alamofire/Alamofire",
    "state" : {
      "revision" : "723fa5a6c65812aec4a0d7cc432ee198883b6e00",
      "version" : "5.9.0"
    }
  }
  */
  if (!pin.location) {
    throw new Error(`No location found for package ${pin.identity} in ${manifestPath}`);
  }

  if (pin.location.startsWith('https://')) {
    const url = new URL(pin.location);

    if (url.hostname === 'github.com') {
      if (!pin?.state?.revision) {
        throw new Error(`No revision found for ${pin.location} in ${manifestPath}`);
      }

      const registry = 'githubRepositories';
      const parts = url.pathname.split('/').filter(Boolean);
      const owner = parts[0];
      const repo = parts[1].endsWith('.git') ? parts[1].slice(0, -4) : parts[1];
      const version = `commit:${pin.state.revision}`;

      return new Package(owner, repo, version, manifestPath, registry);
    }
  }

  throw new Error(`Unsupported remote source: ${pin.location} in ${manifestPath}`);
};

const listPackagesV1 = (logger, manifestPath, manifest) => {
  if (!manifest?.object?.pins) {
    throw new Error(`No 'object.pins' field found in ${manifestPath}`);
  }

  return manifest.object.pins.map((pin) => parsePinV1(manifestPath, pin));
};

const listPackagesV2 = (logger, manifestPath, manifest) => {
  if (!manifest?.pins) {
    throw new Error(`No 'pins' field found in ${manifestPath}`);
  }

  return manifest.pins.map((pin) => parsePinV2(manifestPath, pin));
};

const listPackagesV3 = (logger, manifestPath, manifest) => {
  if (!manifest?.pins) {
    throw new Error(`No 'pins' field found in ${manifestPath}`);
  }

  // v3 pins are identical to v2 pins, so we can use parsePinV2
  return manifest.pins.map((pin) => parsePinV2(manifestPath, pin));
};

export const listPackages = async (logger, manifestPath) => {
  const contents = await fs.readFile(manifestPath, 'utf-8');

  const manifest = JSON.parse(contents);

  switch (manifest.version) {
    case 1:
      return listPackagesV1(logger, manifestPath, manifest);
    case 2:
      return listPackagesV2(logger, manifestPath, manifest);
    case 3:
      return listPackagesV3(logger, manifestPath, manifest);
    default:
      throw new Error(`Unsupported manifest version: ${manifest.version}`);
  }
};
