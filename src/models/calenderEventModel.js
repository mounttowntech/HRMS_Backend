const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["holiday", "meeting", "event","training"],
      default: "event",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    description: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);