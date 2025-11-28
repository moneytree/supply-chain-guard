import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapRegistries } from '../../lib/registries/index.js';

describe('All registries', () => {
  it('follow the prescribed interface', () => {
    let count = 0;
    for (const [name, registry] of Object.entries(mapRegistries())) {
      count += 1;
      assert.equal(
        typeof registry.getPublishTime,
        'function',
        `registry.getPublishTime should be a function in registry ${name}`,
      );
      assert.equal(
        registry.getPublishTime.length,
        2,
        `registry.getPublishTime should take exactly two arguments in registry ${name}`,
      );
    }
    assert.ok(count > 0, 'No registries found');
  });
});
