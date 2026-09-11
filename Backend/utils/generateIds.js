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

async function getNextApplicationSequence(ApplicationModel, spreadsheetRows = []) {
  const year = new Date().getFullYear();
  const prefix = `INT-${year}-`;
  let maxSeq = 0;

  if (ApplicationModel && typeof ApplicationModel.find === "function") {
    try {
      const apps = await ApplicationModel.find(
        { applicationId: new RegExp(`^${prefix}\\d+`) },
        { applicationId: 1 }
      ).lean();

      for (const app of apps) {
        if (app.applicationId && app.applicationId.startsWith(prefix)) {
          const seq = parseInt(app.applicationId.slice(prefix.length), 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    } catch (err) {
      console.warn("Could not query existing applications for max sequence:", err.message);
    }
  }

  if (Array.isArray(spreadsheetRows)) {
    for (const row of spreadsheetRows) {
      if (row.applicationId && row.applicationId.startsWith(prefix)) {
        const seq = parseInt(row.applicationId.slice(prefix.length), 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }

  return maxSeq + 1;
}

async function getNextCertificateSequence(CertificateModel) {
  const year = new Date().getFullYear();
  const prefix = `CERT-${year}-`;
  let maxSeq = 0;

  if (CertificateModel && typeof CertificateModel.find === "function") {
    try {
      const certs = await CertificateModel.find(
        { certificateId: new RegExp(`^${prefix}\\d+`) },
        { certificateId: 1 }
      ).lean();

      for (const cert of certs) {
        if (cert.certificateId && cert.certificateId.startsWith(prefix)) {
          const seq = parseInt(cert.certificateId.slice(prefix.length), 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    } catch (err) {
      console.warn("Could not query existing certificates for max sequence:", err.message);
    }
  }

  return maxSeq + 1;
}

async function getNextOfferReferenceSequence(OfferLetterModel) {
  const year = new Date().getFullYear();
  const prefix = `OFR-${year}-`;
  let maxSeq = 0;

  if (OfferLetterModel && typeof OfferLetterModel.find === "function") {
    try {
      const offers = await OfferLetterModel.find(
        { referenceId: new RegExp(`^${prefix}\\d+`) },
        { referenceId: 1 }
      ).lean();

      for (const offer of offers) {
        if (offer.referenceId && offer.referenceId.startsWith(prefix)) {
          const seq = parseInt(offer.referenceId.slice(prefix.length), 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    } catch (err) {
      console.warn("Could not query existing offer letters for max sequence:", err.message);
    }
  }

  return maxSeq + 1;
}

module.exports = {
  pad,
  generateApplicationId,
  generateApplicationIdFromCounts,
  generateCertificateId,
  generateOfferReferenceId,
  generateVerificationId,
  getNextApplicationSequence,
  getNextCertificateSequence,
  getNextOfferReferenceSequence,
};
