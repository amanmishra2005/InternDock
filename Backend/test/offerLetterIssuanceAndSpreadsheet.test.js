const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const Application = require("../models/Application");
const OfferLetter = require("../models/OfferLetter");
const {
  appendToSpreadsheet,
  readSpreadsheet,
  resolveSheetSchema,
  sanitizeAndFormatRecord,
} = require("../utils/spreadsheetStorage");

test("OfferLetter model schema has required fields and validation", () => {
  assert.ok(OfferLetter.schema.paths.application, "OfferLetter requires application path");
  assert.ok(OfferLetter.schema.paths.student, "OfferLetter requires student path");
  assert.ok(OfferLetter.schema.paths.referenceId, "OfferLetter requires referenceId path");
  assert.ok(OfferLetter.schema.paths.verificationId, "OfferLetter requires verificationId path");
  assert.ok(OfferLetter.schema.paths.pdfUrl, "OfferLetter has pdfUrl path");
});

test("Application model schema includes offerLetterIssued and offerLetterRef", () => {
  assert.ok(Application.schema.paths.offerLetterIssued, "Application must have offerLetterIssued path");
  assert.ok(Application.schema.paths.offerLetterRef, "Application must have offerLetterRef path");
  assert.equal(Application.schema.paths.offerLetterIssued.instance, "Boolean");
  assert.equal(Application.schema.paths.offerLetterRef.instance, "String");
});

test("resolveSheetSchema correctly identifies offer_letters canonical schema", () => {
  const schema = resolveSheetSchema("offer_letters");
  assert.ok(schema);
  assert.equal(schema.name, "offer_letters");
  const headers = schema.columns.map((c) => c.header);
  assert.deepEqual(headers, [
    "Timestamp",
    "Offer Reference ID",
    "Application ID",
    "Student Name",
    "Student Email",
    "College / University",
    "Internship Domain",
    "Track Duration",
    "Start Date",
    "End Date",
    "Issue Date",
    "Verification ID",
  ]);

  // Alias support
  const aliasSchema = resolveSheetSchema("offerletter");
  assert.ok(aliasSchema);
  assert.equal(aliasSchema.name, "offer_letters");
});

test("sanitizeAndFormatRecord formats human-readable offer letter record", () => {
  const raw = {
    referenceId: "ID-INT-2026-9999",
    applicationId: "APP-12345",
    studentName: "Test Student",
    studentEmail: "test.student@example.com",
    collegeName: "Apex University",
    domainName: "Artificial Intelligence",
    durationLabel: "4 Weeks Track",
    startDate: "2026-10-15",
    endDate: "2026-11-15",
    issueDate: "2026-10-10",
    verificationId: "VF-9999-ABCD",
  };

  const sanitized = sanitizeAndFormatRecord("offer_letters", raw);
  assert.ok(sanitized);
  assert.equal(sanitized.canonicalSheetName, "offer_letters");
  assert.equal(sanitized.data["Offer Reference ID"], "ID-INT-2026-9999");
  assert.equal(sanitized.data["Application ID"], "APP-12345");
  assert.equal(sanitized.data["Student Name"], "Test Student");
  assert.equal(sanitized.data["Student Email"], "test.student@example.com");
  assert.equal(sanitized.data["College / University"], "Apex University");
  assert.equal(sanitized.data["Internship Domain"], "Artificial Intelligence");
  assert.equal(sanitized.data["Track Duration"], "4 Weeks Track");
  assert.equal(sanitized.data["Start Date"], "2026-10-15");
  assert.equal(sanitized.data["End Date"], "2026-11-15");
  assert.equal(sanitized.data["Issue Date"], "2026-10-10");
  assert.equal(sanitized.data["Verification ID"], "VF-9999-ABCD");
});

test("appendToSpreadsheet persists offer letters to CSV ledger and prevents duplicates", async () => {
  const uniqueRef = `ID-TEST-${Date.now()}`;
  const record = {
    referenceId: uniqueRef,
    applicationId: "APP-TEST-UNIT",
    studentName: "Verification Student",
    studentEmail: "verify@test.com",
    collegeName: "National Institute of Tech",
    domainName: "Web Development",
    durationLabel: "8 Weeks Track",
    startDate: "2026-10-01",
    endDate: "2026-12-01",
    issueDate: "2026-10-10",
    verificationId: `VER-${Date.now()}`,
  };

  // First append
  const firstResult = await appendToSpreadsheet("offer_letters", record);
  assert.equal(firstResult, true, "First append must return true");

  const ledgerFile = path.resolve(__dirname, "../uploads/spreadsheet_ledger/offer_letters.csv");
  assert.ok(fs.existsSync(ledgerFile), "offer_letters.csv file must exist");
  const content = fs.readFileSync(ledgerFile, "utf8");
  assert.ok(content.includes(uniqueRef), "offer_letters.csv must contain unique reference ID");

  // Read back via readSpreadsheet
  const rows = await readSpreadsheet("offer_letters");
  const matched = rows.find((r) => r.referenceId === uniqueRef || r["Offer Reference ID"] === uniqueRef);
  assert.ok(matched, "readSpreadsheet must locate the newly inserted offer letter record");
  assert.equal(matched.studentName || matched["Student Name"], "Verification Student");

  // Second append with identical reference ID (idempotency check)
  const secondResult = await appendToSpreadsheet("offer_letters", record);
  assert.equal(secondResult, true, "Idempotent retry must return true");

  const updatedContent = fs.readFileSync(ledgerFile, "utf8");
  const occurrences = (updatedContent.match(new RegExp(uniqueRef, "g")) || []).length;
  assert.equal(occurrences, 1, "There must not be duplicate rows for the same offer letter reference ID");
});
