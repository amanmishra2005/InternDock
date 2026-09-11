const test = require('node:test');
const assert = require('node:assert/strict');
const {
  generateApplicationIdFromCounts,
  getNextApplicationSequence,
  generateApplicationId,
} = require('../utils/generateIds');

test('generateApplicationIdFromCounts prefers the highest existing count to avoid duplicate application IDs', () => {
  const id = generateApplicationIdFromCounts(5, 9);
  assert.equal(id, 'INT-2026-00010');
});

test('getNextApplicationSequence identifies the max sequence even when lower IDs are deleted or count is smaller than max ID', async () => {
  const year = new Date().getFullYear();
  const mockApplicationModel = {
    find: () => ({
      lean: async () => [
        { applicationId: `INT-${year}-00001` },
        { applicationId: `INT-${year}-00007` },
        { applicationId: `INT-${year}-00008` },
      ],
    }),
  };

  const nextSeq = await getNextApplicationSequence(mockApplicationModel, []);
  assert.equal(nextSeq, 9);
  assert.equal(generateApplicationId(nextSeq), `INT-${year}-00009`);
});

