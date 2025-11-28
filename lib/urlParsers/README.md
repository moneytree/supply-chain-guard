# URL Parsers

## Internal API requirements

Each URL parser must export the following properties and APIs:

### `isMatch(url: URL) -> boolean`

Given a `URL` object, this function should return `true` if the URL parser can handle this URL, and `false` otherwise. This is used to determine which parser should be used for a specific URL.

### `createPackageFromUrl(manifestPath: string, url: URL) -> Package`

Given a manifest file path and a URL object, this API should parse the URL and return a Package object with the appropriate scope, name, version, manifest path, and registry type.

If the URL matches the parser's `isMatch` criteria but doesn't follow the expected URL pattern, this function should throw an error with a descriptive message.

## Implementation notes

- Package versions may need prefixing with the package type for certain registries (e.g., GitHub Packages).
- Error handling should be consistent across parsers - throw descriptive errors for URLs that match the parser but don't follow expected patterns.
- The `createPackageFromUrl` function should return a `Package` object with the correct registry type for proper downstream processing.

## Adding new URL parsers

When adding support for a new package registry:

1. Create a new parser file following the naming convention `[registry-domain].js`.
2. Implement the required `isMatch` and `createPackageFromUrl` functions.
3. Add the parser to the `parserMap` in `index.js`.
4. Consider adding test cases to verify the parser works correctly with various URL formats.
