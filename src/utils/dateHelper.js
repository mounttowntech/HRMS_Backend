exports.getISTDateString = () => {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
};

exports.percentage = (count, total) => {
  if (!total || total === 0) return 0;
  return Number(((count / total) * 100).toFixed(1));
};