import * as fs from 'node:fs/promises';
import { runCommand } from './os.js';

export const gitLsFiles = async (args) => {
  const flags = [
    '--cached', // include files in the index (staged files)
    '--others', // include untracked files (handy during development)
    '--exclude-standard', // but do apply .gitignore rules
  ];

  const output = await runCommand('git', ['ls-files', ...flags, ...args]);

  const files = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  // remove files that do not exist on disk (ie. deleted but still staged files)

  const existingFiles = [];
  for (const file of files) {
    try {
      const stat = await fs.stat(file);
      if (stat.isFile()) {
        existingFiles.push(file);
      }
    } catch (error) {
      // if the file does not exist, ignore
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return existingFiles;
};

export const gitFilesInDiff = async (targetBranch) => {
  const output = await runCommand('git', ['diff', '--name-only', targetBranch, 'HEAD']);

  const files = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  return files;
};
