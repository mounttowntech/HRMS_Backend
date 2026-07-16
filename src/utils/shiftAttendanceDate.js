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

exports.calculateLateMinutesByShift = (attendanceDate, punchIn, shiftStartTime, graceMinutes = 0) => {
  if (!punchIn || !shiftStartTime) return 0;

  // shiftStartTime example: "09:30" or "19:00"
  const [hours, minutes] = shiftStartTime.split(":").map(Number);

  const shiftStart = new Date(`${attendanceDate}T00:00:00.000+05:30`);
  shiftStart.setHours(hours, minutes, 0, 0);

  const punchInTime = new Date(punchIn);

  const lateMs = punchInTime - shiftStart - graceMinutes * 60 * 1000;

  return lateMs > 0 ? Math.floor(lateMs / 60000) : 0;
};