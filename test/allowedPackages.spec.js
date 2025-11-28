import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPackageExplicitlyAllowed } from '../lib/allowedPackages.js';
import Package from '../lib/Package.js';

describe('allowedPackages', () => {
  describe('isPackageExplicitlyAllowed', () => {
    it('matches packages and rules with no scope', () => {
      const pkg = new Package(null, 'cool-dependency', '1.2.3', './manifest.json', 'npm');

      const allowedPackagesByPath = {
        '.': {
          npm: {
            'cool-dependency': '*',
          },
        },
      };

      const isAllowed = isPackageExplicitlyAllowed(allowedPackagesByPath, pkg);

      assert.ok(isAllowed, 'Expected package to be allowed');
    });

    it('does not match package with no scope to rule with scope and same name', () => {
      const pkg = new Package(null, 'cool-dependency', '1.2.3', './manifest.json', 'npm');

      const allowedPackagesByPath = {
        '.': {
          npm: {
            '@other/cool-dependency': '*',
          },
        },
      };

      const isAllowed = isPackageExplicitlyAllowed(allowedPackagesByPath, pkg);

      assert.ok(!isAllowed, 'Expected package to not be allowed');
    });

    it('does not match package with scope to rule with no scope and same name', () => {
      const pkg = new Package('@other', 'cool-dependency', '1.2.3', './manifest.json', 'npm');

      const allowedPackagesByPath = {
        '.': {
          npm: {
            'cool-dependency': '*',
          },
        },
      };

      const isAllowed = isPackageExplicitlyAllowed(allowedPackagesByPath, pkg);

      assert.ok(!isAllowed, 'Expected package to not be allowed');
    });
  });
});
