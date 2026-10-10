async function pruneRejectedApplications(ApplicationModel = require('../models/Application')) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  await ApplicationModel.deleteMany({
    status: 'Rejected',
    updatedAt: { $lt: cutoff },
  });
}

async function pruneAbandonedDrafts(ApplicationModel = require('../models/Application')) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);

  await ApplicationModel.deleteMany({
    status: 'Draft',
    updatedAt: { $lt: cutoff },
  });
}

module.exports = { pruneRejectedApplications, pruneAbandonedDrafts };
