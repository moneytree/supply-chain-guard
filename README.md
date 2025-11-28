# Supply Chain Guard

A security tool that scans your project's dependencies to identify packages that were published too recently, helping protect against supply chain attacks and malicious package uploads.

## About Moneytree

This tool is proudly developed and maintained by the engineering team at [Moneytree KK](https://getmoneytree.com/), a leading Tokyo-based financial technology company. Our core mission is founded on the principles of Privacy by Design and data integrity, adhering to stringent security standards like ISO 27001. We released this utility in response to the rise of software supply chain attacks, aiming to contribute our expertise back to the open-source community and help developers everywhere secure their supply chains.

## Overview

Supply Chain Guard analyzes manifest files (eg. lockfiles) in your repository and checks if any packages were published within a specified time window (default: 10 days). This helps detect potentially malicious packages that may have been uploaded recently as part of supply chain attacks.

The tool currently supports the following manifest files:

- Bundler (Ruby)
- NPM (JavaScript, TypeScript)
- Pip (Python)
- SPM (Swift)
- Yarn (JavaScript, TypeScript)

And the following registries:

- GitHub packages
- GitHub repositories
- NPM (JavaScript, TypeScript)
- PyPI (Python)
- RubyGems (Ruby)

## Usage

### Requirements

- Node.js ≥ 24.0.0
- Git repository (uses `git ls-files` for discovery)

### Basic Usage

This is an internal Moneytree tool published to GitHub Packages. You have several options to install and run it:

#### Option 1: Run directly with npx (recommended)

```sh
npx @moneytree/supply-chain-guard
```

#### Option 2: Install globally and run

```sh
npm install -g @moneytree/supply-chain-guard
supply-chain-guard
```

Run the tool from your project directory. It will scan all supported manifest files in your repository and flag any packages published within the last 10 days.

### Usage in CI

Typically, you'll want to run Supply Chain Guard from CI, whenever somebody makes a pull request.

Some things to keep in mind:

- Make sure to use a compatible Node.js version in your environment (≥ 24.0.0).
- Use `--diff` to limit scans to changed manifest files only. This will save time and reduce load on the registries that need to be queried.
- If you have dependencies that are hosted on GitHub, set `GITHUB_TOKEN` for calls to the GitHub API.

### Command Line Options

- `--max-release-days-ago <days>` - Set the maximum age threshold in days (default: 10)
- `--concurrency <number>` - Number of concurrent API requests (default: 20)
- `--diff <branch>` - Only include manifest files that differ from this branch
- `--verbose` or `-v` - Enable verbose output
- `-vv` - Enable very verbose output (extra detailed logging)
- `--force` or `-f` - Check packages even from manifest files not recently modified

### Examples

```sh
# Check for packages published in the last 7 days
supply-chain-guard --max-release-days-ago 7

# Use higher concurrency for faster scanning
supply-chain-guard --concurrency 50

# Verbose output to see detailed scanning information
supply-chain-guard --verbose

# Force check even for older manifest files
supply-chain-guard --force

# Very verbose output with extra details
supply-chain-guard -vv

# Combine options
supply-chain-guard --max-release-days-ago 3 --concurrency 30 --verbose --force
```

## Exit Codes

- `0` - Success: No recently published packages found
- `1` - Error: Recently published packages detected
- `2` - Error: Unexpected error occurred
- `3` - Error: Invalid command line arguments

## Allow List

You can create allow lists to exempt specific packages from scanning. This is useful for hotfix releases that you want to adopt specifically because they address a security issue.

### Creating Allow Lists

Create a `.supply-chain-guard-allow.json` file in your project directory:

```json
{
  "npm": {
    "package-name": ["1.2.3", "1.2.4"],
    "@scoped/package": ["4.5.6"]
  },
  "pypi": {
    "some-python-package": ["0.1.2"]
  },
  "rubygems": {
    "some-ruby-gem": ["3.2.1"]
  },
  "githubRepositories": {
    "some-org/some-repo": ["commit:723fa5a6c65812aec4a0d7cc432ee198883b6e00"]
  },
  "githubPackages": {
    "some-org/some-package": ["npm:1.2.3"]
  }
}
```

Wildcards (`*`) are allowed in place of:

- packages: `"npm": "*"`, allowing everything in the registry (not normally advisable -- an exception could be when the registry is down and you absolutely must get CI to pass).
- package name after scope: `"moneytree/*": "*"`, allowing all packages owned by the organization owning this scope.
- versions: `"@moneytree/eslint-config": "*"`, allowing this package, regardless of its version.

For example, to allow all packages authored by Moneytree itself, you can set up this `.supply-chain-guard-allow.json` file in your project root:

```json
{
  "npm": {
    "@moneytree/*": "*"
  },
  "githubRepositories": {
    "moneytree/*": "*"
  },
  "githubPackages": {
    "moneytree/*": "*"
  }
}
```

### Directory-Specific Allow Lists

You can place allow list files in subdirectories to create directory-specific exemptions. The tool will apply allow lists based on the location of the manifest file being scanned.

## How It Works

1. **Discovery**: Scans the repository using `git ls-files` to find all supported manifest files
2. **Filtering**: Skips manifest files that haven't been modified within the threshold period (unless `--force` is used)
3. **Allow List**: Checks for and applies directory-specific allow lists for exempted packages
4. **Parsing**: Extracts package information from manifest files for each supported ecosystem
5. **Validation**: Queries package registries to get publication dates with configurable concurrency
6. **Analysis**: Compares publication dates against the specified threshold
7. **Reporting**: Reports any packages that breach the age threshold

## Troubleshooting

**"No parser found for manifest file"**: The tool encountered a manifest file it doesn't recognize. This usually means support for that package system needs to be added.

**HTTP errors**: Use `--concurrency` with a lower value to reduce concurrent requests to package registries.

**Manifest files being skipped**: By default, the tool only checks manifest files that have been modified within the threshold period. Use `--force` to check all manifest files regardless of modification time.

## Development

Read developer documentation in [DEVELOPMENT.md](https://github.com/moneytree/supply-chain-guard/blob/main/DEVELOPMENT.md).

## Responsible Disclosure

See [SECURITY.md](https://github.com/moneytree/supply-chain-guard/blob/main/SECURITY.md) for information on how to responsibly disclose security vulnerabilities.
