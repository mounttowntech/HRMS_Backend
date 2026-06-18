exports.getAttendanceDateByShift = (shiftName, currentDate = new Date()) => {
  const istDate = new Date(
    currentDate.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  const hour = istDate.getHours();
  const isNightShift = shiftName?.toLowerCase().includes("night");

  if (isNightShift && hour < 5) {
    istDate.setDate(istDate.getDate() - 1);
  }

  return istDate.toLocaleDateString("en-CA");
};