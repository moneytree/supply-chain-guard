import * as fs from 'node:fs/promises';

export const parseArgv = async (errorExitCode, options, schema, argv = process.argv) => {
  // strip off first two elements (`node` and the script path)
  argv = argv.slice(2);

  // --version renders the version

  if (argv.includes('--version')) {
    const packageJson = JSON.parse(await fs.readFile(`${import.meta.dirname}/../../package.json`, 'utf-8'));
    console.log(packageJson.version);
    process.exit(0);
  }

  // --help renders the help text

  if (argv.includes('--help') || argv.includes('-h')) {
    console.log();
    console.log(`Usage: supply-chain-guard [options]`);
    console.log();
    console.log('Options:');

    for (let [arg, spec] of Object.entries(schema)) {
      if (typeof spec === 'string') {
        // aliases do not have their own description
        continue;
      }

      const aliases = Object.entries(schema)
        .filter(([, v]) => v === arg)
        .map(([k]) => k)
        .filter((a) => a !== arg);

      if (aliases.length > 0) {
        arg += `, ${aliases.join(', ')}`;
      }

      const argDesc = `${arg}${spec.hasValue ? '=<value>' : ''}`;
      console.log(`  ${argDesc.padEnd(35)}${spec.description || ''}`);
    }
    console.log();
    process.exit(0);
  }

  // parse all other arguments and apply them to options

  for (let i = 0; i < argv.length; i += 1) {
    let arg = argv[i];
    let argValue;

    // handle `--arg=value` syntax
    const m = arg.match(/^(--[a-z-]+)=(.+)$/);
    if (m) {
      arg = m[1];
      argValue = m[2];
    }

    let spec = schema[arg];
    if (typeof spec === 'string') {
      // alias (eg. -f -> --force)
      spec = schema[spec];
    }

    if (!spec) {
      console.error(`Unknown argument: ${arg}`);
      process.exit(errorExitCode);
    }

    if (spec.hasValue) {
      if (argValue === undefined) {
        // handle `--arg value` syntax
        if (i + 1 >= argv.length) {
          console.error(`Argument ${arg} requires a value`);
          process.exit(errorExitCode);
        }

        argValue = argv[i + 1];
        i += 1;
      }
    } else {
      // if the argument does not take a value, but one was provided via --foo=bar, that's an error
      if (argValue !== undefined) {
        console.error(`Argument ${arg} does not take a value`);
        process.exit(errorExitCode);
      }
    }

    if (spec.option) {
      // --help for example, is not mapped to an option
      options[spec.option] = spec.coerce(argValue);
    }
  }
};
