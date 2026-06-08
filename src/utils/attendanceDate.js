// ======================================================
// GET IST DATE STRING
// Example:
// 2026-05-22
// ======================================================

exports.getISTDateString = () => {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
};

// ======================================================
// GET IST START OF DAY
// Example:
// 2026-05-22 00:00:00 IST
// MongoDB stores:
// 2026-05-21T18:30:00.000Z
// ======================================================

exports.getISTStartOfDay = () => {
  const dateString = exports.getISTDateString();

  return new Date(`${dateString}T00:00:00+05:30`);
};

// ======================================================
// GET IST END OF DAY
// ======================================================

exports.getISTEndOfDay = () => {
  const dateString = exports.getISTDateString();

  return new Date(`${dateString}T23:59:59.999+05:30`);
};