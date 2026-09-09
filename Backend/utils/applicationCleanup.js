async function pruneRejectedApplications(ApplicationModel = require('../models/Application')) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  await ApplicationModel.deleteMany({
    status: 'Rejected',
    updatedAt: { $lt: cutoff },
  });
}

module.exports = { pruneRejectedApplications };
