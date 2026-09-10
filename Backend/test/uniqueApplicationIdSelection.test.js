const test = require('node:test');
const assert = require('node:assert/strict');
const { generateApplicationIdFromCounts } = require('../utils/generateIds');

test('generateApplicationIdFromCounts prefers the highest existing count to avoid duplicate application IDs', () => {
  const id = generateApplicationIdFromCounts(5, 9);
  assert.equal(id, 'INT-2026-00010');
});
