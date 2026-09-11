const test = require("node:test");
const assert = require("node:assert/strict");
const { getRequiredTaskCount, canIssueCertificate } = require("../utils/certificateEligibility");

test("task count config returns proper requirements across duration tracks", () => {
  assert.equal(getRequiredTaskCount(4), 1);
  assert.equal(getRequiredTaskCount(6), 2);
  assert.equal(getRequiredTaskCount(8), 2);
  assert.equal(getRequiredTaskCount(12), 3);
  assert.equal(getRequiredTaskCount(24), 4);
});

test("canIssueCertificate requires successful payment, final report, and required tasks", () => {
  const app = {
    paymentStatus: "Successful",
    finalReportSubmitted: true,
  };

  // Not enough tasks submitted
  assert.equal(canIssueCertificate(app, 0, 1), false);
  assert.equal(canIssueCertificate(app, 1, 2), false);

  // Meets required tasks
  assert.equal(canIssueCertificate(app, 1, 1), true);
  assert.equal(canIssueCertificate(app, 2, 2), true);
  assert.equal(canIssueCertificate(app, 3, 2), true);

  // Missing payment
  assert.equal(canIssueCertificate({ ...app, paymentStatus: "Pending" }, 1, 1), false);

  // Missing final report
  assert.equal(canIssueCertificate({ ...app, finalReportSubmitted: false }, 1, 1), false);
});
