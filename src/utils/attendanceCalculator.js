const DEFAULT_BREAK_MINUTES = 60;
const FULL_DAY_MINUTES = 480; // 8 hours
const HALF_DAY_MINUTES = 240; // 4 hours
const FULL_DAY_GRACE = 5; // 5 minutes

exports.minutesDiff = (start, end) => {
  return Math.floor((new Date(end) - new Date(start)) / 60000);
};

exports.calculateAttendance = (attendance) => {
  let actualBreakMinutes = 0;
  let requiredMinutes = FULL_DAY_MINUTES;

  const day = new Date(attendance.attendanceDate)
  .toLocaleDateString("en-US", { weekday: "long" });

  if (day === "Saturday") {
    requiredMinutes = 390; // 7.5 hours after 60 min break
  }

  const halfDayMinutes = requiredMinutes / 2;

  if (attendance.breaks?.length) {
    actualBreakMinutes = attendance.breaks.reduce((sum, item) => {
      if (item.minutes) return sum + item.minutes;

      if (item.breakIn && item.breakOut) {
        return sum + exports.minutesDiff(item.breakIn, item.breakOut);
      }

      return sum;
    }, 0);
  }

  attendance.totalBreakMinutes = Math.max(
    DEFAULT_BREAK_MINUTES,
    actualBreakMinutes
  );

  attendance.extraBreakMinutes =
    actualBreakMinutes > DEFAULT_BREAK_MINUTES
      ? actualBreakMinutes - DEFAULT_BREAK_MINUTES
      : 0;

  if (attendance.punchIn && attendance.punchOut) {
    const totalMinutes = exports.minutesDiff(
      attendance.punchIn,
      attendance.punchOut
    );

    attendance.workingMinutes = Math.max(
      0,
      totalMinutes - attendance.totalBreakMinutes
    );

    attendance.overtimeMinutes =
      attendance.workingMinutes > requiredMinutes
        ? attendance.workingMinutes - requiredMinutes
        : 0;

    // if (attendance.workingMinutes >= FULL_DAY_MINUTES) {
    //   attendance.status = "present";
    //   attendance.session = "full_day";
    // } else if (attendance.workingMinutes <= HALF_DAY_MINUTES) {
    //   attendance.status = "half_day";
    //   attendance.session = "half_day";
    // } else {
    //   attendance.status = "absent";
    //   attendance.session = "absent";
    // }
    if (attendance.workingMinutes >= (requiredMinutes - FULL_DAY_GRACE)) {
      attendance.status = "present";
      attendance.session = "full_day";
    } else if (attendance.workingMinutes >= halfDayMinutes) {
      attendance.status = "half_day";
      attendance.session = "half_day";
    } else {
      attendance.status = "absent";
      attendance.session = "absent";
    }
  }

  return attendance;
};

exports.calculateLateMinutes = (attendanceDate, punchIn, shiftName = "Day Shift") => {
  if (!punchIn) return 0;

  const shiftStart = shiftName?.toLowerCase().includes("night")
    ? "19:00"
    : "09:30";

  const officeStart = new Date(`${attendanceDate}T${shiftStart}:00+05:30`);

  const lateMinutes = exports.minutesDiff(officeStart, punchIn);

  return lateMinutes > 0 ? lateMinutes : 0;
};