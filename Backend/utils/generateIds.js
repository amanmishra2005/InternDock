const { v4: uuidv4 } = require("uuid");

function pad(num, size) {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

function generateApplicationId(sequence) {
  const year = new Date().getFullYear();
  return `INT-${year}-${pad(sequence, 5)}`;
}

function generateApplicationIdFromCounts(spreadsheetCount = 0, databaseCount = 0) {
  const year = new Date().getFullYear();
  const sequence = Math.max(Number(spreadsheetCount) || 0, Number(databaseCount) || 0) + 1;
  return `INT-${year}-${pad(sequence, 5)}`;
}

function generateCertificateId(sequence) {
  const year = new Date().getFullYear();
  return `CERT-${year}-${pad(sequence, 8)}`;
}

function generateOfferReferenceId(sequence) {
  const year = new Date().getFullYear();
  return `OFR-${year}-${pad(sequence, 8)}`;
}

function generateVerificationId() {
  return uuidv4().replace(/-/g, "");
}

module.exports = {
  generateApplicationId,
  generateApplicationIdFromCounts,
  generateCertificateId,
  generateOfferReferenceId,
  generateVerificationId,
};
