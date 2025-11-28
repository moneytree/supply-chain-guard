# Contributing to Supply Chain Guard

Thank you for your interest in contributing to Moneytree's **Supply Chain Guard**! This tool is designed to be lean, reliable, and secure. Therefore, we maintain a very strict policy regarding external dependencies and overall scope.

By contributing, you agree to abide by the project's MIT License.

---

## Contribution Policy and Out of Scope

To maintain the project's stability and security focus, we are primarily interested in contributions that expand the utility and correctness of the existing tool.

### We Will Primarily Consider:

- **Critical Bug Fixes:** Corrections for issues that prevent the tool from functioning correctly.
- **Quality-of-Life Improvements (QoL):** Changes that improve developer experience or minor usability enhancements without altering the core logic or introducing new features.
- **New or Improved Platform/Ecosystem Support:** Adding support for new package manager lockfiles or registries, or improved support in the existing implementations.
- **Documentation and Typo Fixes.**

### We Will Not Accept (Out of Scope):

- **New Features** outside of new platform support (e.g., changes to the core logic of how dependency age is determined), unless first agreed upon via an Issue.
- **Major Refactoring** or changes that significantly alter the existing architecture.
- **Style** changes.

---

## Technical Requirements & Standards

The following requirements are **non-negotiable** for any accepted contribution:

### 1. Dependency Constraints (Crucial)

**DO NOT** introduce any new runtime or development dependencies into the `package.json` file. The current dependency list must be maintained.

### 2. Testing

All changes, especially new platform additions, must include comprehensive **new or updated unit tests**. CI tests are run automatically and **must pass** for the Pull Request to be considered.

### 3. Code Style

- The codebase is written in **Node.js (JavaScript)**.
- All code must pass the existing formatting standards (enforced by `prettier`).

---

## How to Contribute

### 1. Reporting Issues and Seeking Support

- If you find a bug or have an idea, **open an Issue** first to discuss your idea with the maintainer before starting work.
- For questions or support, please read the project documentation first, and then open an issue if your question is not resolved. **Do not** use pull requests for support questions.

### 2. Submitting a Pull Request (PR)

1.  **Fork** the repository and create a new branch from `main`.
2.  Implement your changes, ensuring they meet the **Technical Requirements** above.
3.  Include thorough tests and run them locally.
4.  Submit a Pull Request (PR) targeting the `main` branch. Reference the Issue number it resolves (e.g., `Fixes #123`).

We reserve the right to close any PR that violates these policies. We appreciate you helping us keep **Supply Chain Guard** secure and focused!
