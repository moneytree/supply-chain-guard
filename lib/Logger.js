import { styleText } from 'node:util';

const verbosityLevels = [0, 1, 2]; // 0 = not verbose, 1 = verbose, 2 = very verbose

export default class Logger {
  static verbosity = 0;

  constructor(context = []) {
    this.context = context.slice();
  }

  static setVerbosity(level) {
    if (!verbosityLevels.includes(level)) {
      throw new Error(`Invalid verbosity level: ${level}`);
    }

    Logger.verbosity = level;
  }

  info(...args) {
    // 0 is always logged
    this.out(0, ...args);
  }

  v(...args) {
    // 1 is logged if we're at least verbose
    this.out(1, ...args);
  }

  vv(...args) {
    // 2 is only logged if we're very verbose
    this.out(2, ...args);
  }

  out(verbosityLevel, ...args) {
    if (Logger.verbosity >= verbosityLevel) {
      if (this.context.length > 0) {
        console.log(styleText('yellow', `[${this.context.join('][')}]`), ...args);
      } else {
        console.log(...args);
      }
    }
  }

  error(...args) {
    // errors are always logged, so we do not check verbosity level
    if (this.context.length > 0) {
      console.error(styleText('yellow', `[${this.context.join('][')}]`), ...args);
    } else {
      console.error(...args);
    }
  }

  /**
   * @param {string|string[]} context
   * @returns {Logger}
   */
  branchWithContext(context) {
    return new Logger(this.context.concat(context));
  }

  /**
   * @param {string|string[]} context
   * @param {Function} cb
   */
  withContext(context, cb) {
    const lengthBefore = this.context.length;
    this.context = this.context.concat(...context);

    try {
      cb();
    } finally {
      this.context.splice(lengthBefore, context.length);
    }
  }

  // reusable messages

  logRegistryNotImplemented(pkg) {
    this.withContext([pkg.name], () => {
      this.error('Registry', styleText('cyan', pkg.registry), 'is not yet implemented');
    });
  }
}
