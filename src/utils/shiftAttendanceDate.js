exports.getAttendanceDateByShift = (shiftName, currentDate = new Date()) => {
  const istDate = new Date(
    currentDate.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  const hour = istDate.getHours();

  const isNightShift = shiftName?.toLowerCase().includes("night");

  // Night shift: 19:00 to 04:00
  // After 12 AM until 04:59 AM should belong to previous attendance date
  if (isNightShift && hour < 5) {
    istDate.setDate(istDate.getDate() - 1);
  }

  return istDate.toLocaleDateString("en-CA");
};