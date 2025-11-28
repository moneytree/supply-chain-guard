import { open } from 'node:fs/promises';
import Package from '../Package.js';

export const manifestFiles = [
  'Gemfile.lock',
  'Gemfile.canary.lock', // Moneytree custom by mt-omoikane and mt-guest-service
];

const parseGemfileLock = async (manifestPath) => {
  // create a whitespace based structure like this:
  // { value: 'GIT', children: [
  //   { value: 'remote: https://github.com/moneytree/rubocop-config.git', parent: ... },
  //   { value: 'revision: c6bdd8755b03d47860e98070e9f9f72bf57f01b2', parent: ... },
  //   { value: 'tag: v1.0.4', parent: ... },
  //   { value: 'specs:', children: [
  //     { value: 'moneytree-rubocop-config (1.0.3)', parent: ..., children: [
  //       { value: 'rubocop (>= 0.81.0)', parent: ... },
  //       { value: 'rubocop-rails (>= 2.5.0)', parent: ... },
  //     ] },
  //   ] }
  // ] }

  let indentLevel = -1;
  let indentSize = null; // should be 2, but we can easily detect it
  const rootNode = { children: [] }; // root node has no value, only children
  let currentNode = rootNode;

  const file = await open(manifestPath, 'r');
  for await (const line of file.readLines()) {
    const trimmedLine = line.trim();

    if (trimmedLine === '') {
      // ignore empty lines
      continue;
    }

    const spaceCount = line.length - line.trimStart().length;
    let newIndentLevel;

    if (spaceCount === 0) {
      newIndentLevel = 0;
    } else {
      if (indentSize === null) {
        // the first time we see an indented line, detect indent size for this file
        indentSize = spaceCount;
      }

      newIndentLevel = spaceCount / indentSize;
    }

    if (newIndentLevel > indentLevel) {
      // deeper level than previous line
      const child = { value: trimmedLine, parent: currentNode };
      currentNode.children ||= [];
      currentNode.children.push(child);
      currentNode = child;
      indentLevel = newIndentLevel;
    } else {
      // get to the right level
      while (indentLevel > newIndentLevel) {
        currentNode = currentNode.parent;
        indentLevel -= 1;
      }

      const parent = currentNode.parent || rootNode;

      const sibling = { value: trimmedLine, parent };

      parent.children ||= [];
      parent.children.push(sibling);
      currentNode = sibling;
    }
  }

  await file.close();

  // console.log(inspect(rootNode, {
  //   depth: null,
  //   colors: true,
  //   customInspect: false
  // }));

  return rootNode;
};

const parseRemote = (remote) => {
  const url = new URL(remote);

  if (url.hostname === 'rubygems.org') {
    return { registry: 'rubygems', scope: null, name: null };
  }

  if (url.hostname === 'github.com') {
    // https://github.com/moneytree/rubocop-config.git -> scope: moneytree

    const parts = url.pathname.split('/').filter(Boolean);
    const scope = parts[0];
    const name = parts[1]?.replace(/\.git$/, '');

    return { registry: 'githubRepositories', scope, name };
  }

  throw new Error(`Unsupported remote: ${remote}`);
};

export const listPackages = async (logger, manifestPath) => {
  const rootNode = await parseGemfileLock(manifestPath);

  const dependencies = [];

  for (const topNode of rootNode.children) {
    // skip nodes that don't hold dependencies (eg. RUBY VERSION)
    if (topNode.value !== 'GIT' && topNode.value !== 'GEM') {
      continue;
    }

    const specsNode = topNode.children.find((child) => child.value === 'specs:');
    if (!specsNode || !specsNode.children) {
      // no dependencies mentioned
      continue;
    }

    const remote = topNode.children?.find((child) => child.value.startsWith('remote: '))?.value?.slice(8);
    if (!remote) {
      throw new Error(`Missing remote in Gemfile.lock: ${manifestPath}`);
    }

    const revision = topNode.children?.find((child) => child.value.startsWith('revision: '))?.value?.slice(10);
    const { registry, scope, name } = parseRemote(remote);

    if (revision) {
      if (specsNode.children.length !== 1) {
        throw new Error(`Expected exactly one spec when revision is present, got ${specsNode.children.length}`);
      }

      dependencies.push(new Package(scope, name, `commit:${revision}`, manifestPath, registry));
    } else {
      for (const child of specsNode.children) {
        const [_, name, version] = child.value.match(/^([^\s]+) \((.+)\)$/) || [];

        dependencies.push(new Package(scope, name, version, manifestPath, registry));
      }
    }
  }

  // console.log(inspect(dependencies, {
  //   depth: null,
  //   colors: true,
  //   customInspect: false
  // }));

  return dependencies;
};
