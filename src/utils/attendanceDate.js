exports.getISTDateString = () => {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
};

exports.getISTStartOfDay = () => {
  const dateString = exports.getISTDateString();
  return new Date(`${dateString}T00:00:00+05:30`);
};

exports.getISTEndOfDay = () => {
  const dateString = exports.getISTDateString();
  return new Date(`${dateString}T23:59:59.999+05:30`);
};