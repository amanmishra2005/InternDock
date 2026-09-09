const test = require('node:test');
const assert = require('node:assert/strict');
const { pruneRejectedApplications } = require('../utils/applicationCleanup');

test('pruneRejectedApplications removes rejected applications that have aged beyond seven days', async () => {
  const calls = [];
  const fakeModel = {
    deleteMany: async (query) => {
      calls.push(query);
      return { deletedCount: 1 };
    },
  };

  await pruneRejectedApplications(fakeModel);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].status, 'Rejected');
  assert.ok(calls[0].updatedAt && calls[0].updatedAt.$lt instanceof Date);
});
