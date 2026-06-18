const DEFAULT_BREAK_MINUTES = 60;
const OFFICE_START = "09:30";
const FULL_DAY_MINUTES = 480;
const HALF_DAY_MINUTES = 240;

exports.minutesDiff = (start, end) => {
  return Math.floor((new Date(end) - new Date(start)) / 60000);
};

const getISTTime = (attendanceDate, time) => {
  return new Date(`${attendanceDate}T${time}:00+05:30`);
};

exports.calculateLateMinutes = (attendanceDate, punchIn) => {
  if (!punchIn) return 0;

  const officeStart = getISTTime(attendanceDate, OFFICE_START);
  const lateMinutes = exports.minutesDiff(officeStart, punchIn);

  return lateMinutes > 0 ? lateMinutes : 0;
};

exports.calculateAttendance = (attendance) => {
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

    attendance.lateMinutes = exports.calculateLateMinutes(
      attendance.attendanceDate,
      attendance.punchIn
    );

    attendance.isLate = attendance.lateMinutes > 0;

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