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

exports.formatISTDateTime = (date) => {
  if (!date) return null;

  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};