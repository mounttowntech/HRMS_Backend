exports.calculateDays = (fromDate, toDate) =>
  Math.floor((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) +
  1;
