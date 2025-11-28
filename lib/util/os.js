import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';

export const runCommand = async (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'inherit'],
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} process exited with code ${code}`));
      } else {
        resolve(output);
      }
    });
  });
};

export const getLastModifiedTime = async (filePath) => {
  try {
    // %ct: committer date, UNIX timestamp

    const output = await runCommand('git', ['log', '-1', '--format=%ct', '--', filePath]);
    const timestamp = parseInt(output.trim(), 10);
    if (isNaN(timestamp)) {
      throw new Error(`Could not get last modified time for file: ${filePath}`);
    }

    return timestamp * 1000;
  } catch (error) {
    // not a file tracked by git yet, fallback to file mtime
    const stat = await fs.stat(filePath);
    return stat.mtimeMs;
  }
};
