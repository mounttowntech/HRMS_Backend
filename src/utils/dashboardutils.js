// utils/dashboardUtils.js

exports.getISTDateString = () => {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
};

exports.percentage = (count, total) => {
  if (!total || total === 0) return 0;
  return Number(((count / total) * 100).toFixed(1));
};

exports.getISTMonthRange = () => {
  const now = new Date();

  const istDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  const year = istDate.getFullYear();
  const month = istDate.getMonth();

  const start = new Date(year, month, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, month + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

exports.getMonthRangeByMonthYear = (month, year) => {
  const start = new Date(year, month - 1, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, month, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};