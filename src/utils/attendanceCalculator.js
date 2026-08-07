const DEFAULT_BREAK_MINUTES = 60;
const FULL_DAY_MINUTES = 480; // 8 Hours
const HALF_DAY_MINUTES = 240; // 4 Hours
const BREAK_ELIGIBLE_MINUTES = 360; // 6 hours

/* ==========================================================
   Minutes Difference
========================================================== */

exports.minutesDiff = (start, end) => {
  if (!start || !end) return 0;

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (isNaN(startTime) || isNaN(endTime)) {
    return 0;
  }

  return Math.max(0, Math.floor((endTime - startTime) / 60000));
};

/* ==========================================================
   Calculate Attendance
========================================================== */

exports.calculateAttendance = (attendance) => {
  if (!attendance) return attendance;

  let actualBreakMinutes = 0;
  let requiredMinutes = FULL_DAY_MINUTES;

    const day = new Date(attendance.attendanceDate)
  .toLocaleDateString("en-US", { weekday: "long" });

  if (day === "Saturday") {
    requiredMinutes = 450; // 7.5 hours after 60 min break
  }

  const halfDayMinutes = requiredMinutes / 2;
  /* =========================================
     Calculate Break Minutes
  ========================================= */

  if (attendance.breaks && attendance.breaks.length > 0) {
    attendance.breaks.forEach((item) => {
      if (item.minutes && item.minutes > 0) {
        actualBreakMinutes += item.minutes;
      } else if (item.breakIn && item.breakOut) {
        actualBreakMinutes += exports.minutesDiff(
          item.breakIn,
          item.breakOut
        );
      }
    });
  }

  attendance.totalBreakMinutes = Math.max(
    DEFAULT_BREAK_MINUTES,
    actualBreakMinutes
  );

  attendance.extraBreakMinutes =
    actualBreakMinutes > DEFAULT_BREAK_MINUTES
      ? actualBreakMinutes - DEFAULT_BREAK_MINUTES
      : 0;

  /* =========================================
     Working Minutes
  ========================================= */

  attendance.workingMinutes = 0;
  attendance.overtimeMinutes = 0;

  if (attendance.punchIn && attendance.punchOut) {
    let totalMinutes = exports.minutesDiff(
      attendance.punchIn,
      attendance.punchOut
    );

    if(attendance?.permissionApproved && attendance?.permissionMinutes) {
      totalMinutes += attendance.permissionMinutes;
    }

    let breakMinutes = actualBreakMinutes;

    // Apply default break only for employees
    // who worked a full-day duration.
    if (totalMinutes >= BREAK_ELIGIBLE_MINUTES && actualBreakMinutes === 0) {
      breakMinutes = DEFAULT_BREAK_MINUTES;
    }

    attendance.totalBreakMinutes = breakMinutes;

    attendance.workingMinutes = Math.max(
      0,
      totalMinutes - attendance.totalBreakMinutes
    );

    attendance.overtimeMinutes =
      attendance.workingMinutes > requiredMinutes
        ? attendance.workingMinutes - requiredMinutes
        : 0;

    /* =========================================
       Status & Session
    ========================================= */

    if (attendance.workingMinutes >= requiredMinutes) {
      attendance.status = "present";
      attendance.session = "full_day";
    } else if (attendance.workingMinutes >= halfDayMinutes) {
      attendance.status = "half_day";
      attendance.session = "half_day";
    } else {
      attendance.status = "absent";
      attendance.session = "absent";
    }

    /* =========================================
       Debug Logs
    ========================================= */

    console.log("========================================");
    console.log("Attendance Calculation");
    console.log("----------------------------------------");
    console.log("Punch In          :", attendance.punchIn);
    console.log("Punch Out         :", attendance.punchOut);
    console.log("Total Minutes     :", totalMinutes);
    console.log("Break Minutes     :", attendance.totalBreakMinutes);
    console.log("Extra Break       :", attendance.extraBreakMinutes);
    console.log("Working Minutes   :", attendance.workingMinutes);
    console.log("Overtime Minutes  :", attendance.overtimeMinutes);
    console.log("Status            :", attendance.status);
    console.log("Session           :", attendance.session);
    console.log("========================================");
  } else {
    console.log("Punch In or Punch Out missing.");
  }

  return attendance;
};

/* ==========================================================
   Calculate Late Minutes
========================================================== */

exports.calculateLateMinutes = (
  attendanceDate,
  punchIn,
  shiftName = "General Shift"
) => {
  if (!attendanceDate || !punchIn) return 0;

  let shiftStartTime = "09:30";

  if (
    shiftName &&
    shiftName.toLowerCase().includes("night")
  ) {
    shiftStartTime = "19:00";
  }

  const officeStart = new Date(
    `${attendanceDate}T${shiftStartTime}:00+05:30`
  );

  const lateMinutes = exports.minutesDiff(
    officeStart,
    punchIn
  );

  return lateMinutes > 0 ? lateMinutes : 0;
};

/* ==========================================================
   Calculate Early Leaving
========================================================== */

exports.calculateEarlyLeavingMinutes = (
  attendanceDate,
  punchOut,
  shiftName = "General Shift"
) => {
  if (!attendanceDate || !punchOut) return 0;

  let shiftEndTime = "18:30";

  if (
    shiftName &&
    shiftName.toLowerCase().includes("night")
  ) {
    shiftEndTime = "04:00";
  }

  const officeEnd = new Date(
    `${attendanceDate}T${shiftEndTime}:00+05:30`
  );

  const earlyMinutes = exports.minutesDiff(
    punchOut,
    officeEnd
  );

  return earlyMinutes > 0 ? earlyMinutes : 0;
};

exports.calculateAttendanceStatus = (attendance) => {

  // const FULL_DAY_MINUTES = 480;
  // const HALF_DAY_MINUTES = 240;

  // Employee hasn't checked out yet
    if (!attendance.punchOut) {
        return attendance;
    }

    let actualBreakMinutes = 0;

  let minutes =
    attendance.effectiveMinutes ||
    attendance.workingMinutes ||
    0;

    //  break reduce in minutes if permission is approved and has permission minutes
    // if (attendance.permissionApproved && attendance.permissionMinutes) {
    //   if(attendance.breaks && attendance.breaks.length > 0) {
    //     attendance.breaks.forEach((item) => {
    //       if (item.minutes && item.minutes > 0) {
    //         actualBreakMinutes += item.minutes;
    //       } else if (item.breakIn && item.breakOut) {
    //          actualBreakMinutes += exports.minutesDiff(
    //           item.breakIn,
    //           item.breakOut
    //         );
    //       }
    //     });
    //   }
    // }

  //need to reduce the break minutes from the total minutes if permission is approved and has permission minutes
  // if (attendance.permissionApproved && attendance.permissionMinutes) {
  //   minutes -= actualBreakMinutes;
  // }

  // console.log("minutes:", minutes, "actualBreakMinutes:", actualBreakMinutes, "permissionApproved:", attendance.permissionApproved, "permissionMinutes:", attendance.permissionMinutes);
  if (minutes >= FULL_DAY_MINUTES) {

    attendance.status = "present";
    attendance.session = "full_day";
    attendance.payableDay = 1;

  } else if (minutes >= HALF_DAY_MINUTES) {

    attendance.status = "half_day";
    attendance.session = "half_day";
    attendance.payableDay = 0.5;

  } else {

    attendance.status = "absent";
    attendance.session = "absent";
    attendance.payableDay = 0;
  }

  return attendance;
}

/* ==========================================================
   Constants
========================================================== */

exports.DEFAULT_BREAK_MINUTES = DEFAULT_BREAK_MINUTES;
exports.FULL_DAY_MINUTES = FULL_DAY_MINUTES;
exports.HALF_DAY_MINUTES = HALF_DAY_MINUTES;