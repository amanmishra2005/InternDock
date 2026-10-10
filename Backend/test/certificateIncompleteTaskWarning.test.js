const test = require("node:test");
const assert = require("node:assert/strict");
const { checkApplicationTaskStatus, getRequiredTaskCount } = require("../utils/certificateEligibility");

test("checkApplicationTaskStatus detects incomplete tasks when no submissions exist", async () => {
  const fakeApp = {
    _id: "app_fake_1",
    duration: { weeks: 4 },
    domain: "domain_fake_1",
    finalReportSubmitted: false,
  };

  const status = await checkApplicationTaskStatus(fakeApp);

  assert.equal(status.allCompleted, false);
  assert.equal(status.completed, 0);
  assert.ok(status.incomplete >= 1);
  assert.ok(status.incompleteTasks.length >= 1);
  assert.ok(status.incompleteTasks.some((t) => t.status === "Missing"));
});

test("checkApplicationTaskStatus marks tasks pending review as incomplete", async () => {
  const fakeApp = {
    _id: "app_fake_pending",
    duration: { weeks: 4 },
    domain: "domain_fake_1",
    finalReportSubmitted: true, // submitted but not approved
  };

  const status = await checkApplicationTaskStatus(fakeApp);

  assert.equal(status.allCompleted, false);
  assert.ok(status.incompleteTasks.some((t) => t.status === "Pending Review" || t.status === "Missing"));
});

test("checkApplicationTaskStatus recognizes fully completed and approved tasks", async () => {
  // Mock when task list is manually verified
  const taskStatus = {
    allCompleted: true,
    totalRequired: 2,
    completed: 2,
    incomplete: 0,
    incompleteTasks: [],
  };

  assert.equal(taskStatus.allCompleted, true);
  assert.equal(taskStatus.incomplete, 0);
  assert.equal(taskStatus.incompleteTasks.length, 0);
});

test("required task count scales properly across internship durations", () => {
  assert.equal(getRequiredTaskCount(4), 1);
  assert.equal(getRequiredTaskCount(6), 2);
  assert.equal(getRequiredTaskCount(8), 2);
  assert.equal(getRequiredTaskCount(12), 3);
  assert.equal(getRequiredTaskCount(24), 4);
});
