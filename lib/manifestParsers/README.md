# Manifest Parsers

## Internal API requirements

Each parser must export the following properties and APIs:

### `manifestFiles: string[]`

A list of filenames that the system recognizes as manifest (or lock) files (eg. `package-lock.json`, or `Pipfile.lock`).

Manifest files that are not yet supported, should also be mentioned here. That way, we're not skipping over known cases, which could contain too-recent versions. We're failing early and loudly. The likely only right next step when this is encountered is to implement support.

### `async listPackages(logger: Logger, manifestPath: string) -> Package[]`

Given the path to a manifest file, this API should return an array of Package objects.

## Manifest samples

Various public codebases provide samples that inform us about the format and type of contents of different manifest files. We keep a list here as an easy reference:

| NPM                |                                                      |
| ------------------ | ---------------------------------------------------- |
| v1                 | [package-lock.json][package-lock-v1]                 |
| v2                 | [package-lock.json][package-lock-v2]                 |
| v2 with workspaces | [package-lock.json][package-lock-v2-with-workspaces] |
| v3                 | [package-lock.json][package-lock-v3]                 |

[package-lock-v1]: https://github.com/moneytree/eslint-config/blob/72a7dad73ebf112e6342392d98bd62116161db5d/package-lock.json
[package-lock-v2]: https://github.com/github/markdown-toolbar-element/blob/eb2e1fb183e715aab5764e608119dc6c9215b5dc/package-lock.json
[package-lock-v2-with-workspaces]: https://github.com/github/vscode-github-actions/blob/8dd807bea51cd4a987e9f6b747fcfd1455f22f3e/script/workspace/package-lock.json
[package-lock-v3]: https://github.com/github/spark-template/blob/2a69354d2331c5f6171841a75c2312311d101beb/package-lock.json

| Pip |                                 |
| --- | ------------------------------- |
| v6  | [Pipfile.lock][pipfile-lock-v6] |

[pipfile-lock-v6]: https://github.com/github/osv-schema/blob/c4b40a12f0881d30351ec8f32b2be8d587b3199c/tools/ghsa/Pipfile.lock

| Bundler |                              |
| ------- | ---------------------------- |
| v2      | [Gemfile.lock][gemfile-lock] |

[gemfile-lock]: https://github.com/github/markup/blob/2b0e7f216904253092c90754cd95aac6d499583d/Gemfile.lock

| Swift PM |                                         |
| -------- | --------------------------------------- |
| v1       | [Package.resolved][package-resolved-v1] |
| v2       | [Package.resolved][package-resolved-v2] |
| v3       | [Package.resolved][package-resolved-v3] |

[package-resolved-v1]: https://github.com/uakbr/ScribeAI/blob/f3f4ac56f6ee28d71ba1401115618e6a751f4419/WhisperTranscriptionApp.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved
[package-resolved-v2]: https://github.com/github/CopilotForXcode/blob/65e54a820fee831d4589e3a913da79684206d9b9/Copilot%20for%20Xcode.xcworkspace/xcshareddata/swiftpm/Package.resolved
[package-resolved-v3]: https://github.com/supabase/supabase-swift/blob/af786cb012b472dd502974c29c6817f11923901b/Package.resolved

## Samples of currently unsupported manifest files

### CocoaPods

| CocoaPods        |                                                            |
| ---------------- | ---------------------------------------------------------- |
| Why unsupported? | It is incredibly difficult to resolve packages to a source |
| Link             | [Podfile.lock][podfile-lock]                               |

[podfile-lock]: https://github.com/37MobileTeam/AppleParty/blob/4286e9b0f99066b2ef4acf28b10611feeeb87c9d/Podfile.lock
