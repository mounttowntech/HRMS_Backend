exports.minutesDiff = (start, end) => {
  return Math.floor((new Date(end) - new Date(start)) / 60000);
};

exports.calculateAttendance = (attendance) => {
  const DEFAULT_BREAK_MINUTES = 60;
  const FULL_DAY_MINUTES = 480;
  const HALF_DAY_MINUTES = 240;

  let actualBreakMinutes = 0;

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

  if (attendance.punchIn && attendance.punchOut) {
    const totalMinutes = exports.minutesDiff(
      attendance.punchIn,
      attendance.punchOut
    );

    attendance.workingMinutes = Math.max(
      0,
      totalMinutes - attendance.totalBreakMinutes
    );

    if (attendance.workingMinutes >= FULL_DAY_MINUTES) {
      attendance.status = "present";
      attendance.session = "full_day";
    } else if (attendance.workingMinutes >= HALF_DAY_MINUTES) {
      attendance.status = "half_day";
      attendance.session = "half_day";
    } else {
      attendance.status = "absent";
      attendance.session = "absent";
    }
  }

  return attendance;
};