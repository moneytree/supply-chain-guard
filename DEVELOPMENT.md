# Development

If you're a new contributor to this project, please first read [CONTRIBUTING.md](https://github.com/moneytree/supply-chain-guard/blob/main/CONTRIBUTING.md).

## Running Tests

To run the test suite, you need to have a `GITHUB_TOKEN` environment variable set up, which has at least the `read:packages` scope.

```sh
npm test
```

## Running Tests with Coverage

```sh
npm run coverage
```

## Project Structure

```
lib/
├── manifestParsers/         # Manifest file parsers for different ecosystems
├── registries/              # Package registry API clients
├── urlParsers/              # URL parsers for different ecosystems
├── util/                    # Utility functions
├── allowedPackages.js       # Allow list handling
├── findBreaches.js          # Main scanning logic
├── Logger.js                # Logging with verbosity levels
└── Package.js               # Package data model
index.js                     # Entry point
```

## Releasing a new version of Supply Chain Guard

To release a new version:

1. Create a new branch to work from.
2. Change the version number in `package.json`.
3. Run `npm install` to update the version in `package-lock.json` to match the new version.
4. Commit the changes to these two files, push the branch to GitHub and create a Pull Request.
5. Run `npm login` to log into NPM.
6. Run `npm publish` to publish the package.
