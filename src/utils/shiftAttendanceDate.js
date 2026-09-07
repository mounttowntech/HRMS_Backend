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

exports.timeToMinutes = (time) => {
  if (!time) return null;

  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    console.log("Invalid shift time:", time);
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  if (period === "PM" && hours !== 12) {
    hours += 12;
  }

  return hours * 60 + minutes;
};