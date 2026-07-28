const mongoose=require("mongoose");
const holidaySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },

  holidayName: {
    type: String,
    required: true,
  },

  holidayDate: {
    type: Date,
    required: true,
  },

  holidayType: {
    type: String,
    enum: [
      "National",
      "Festival",
      "Company",
    ],
    default: "Company",
  },

  description: String,

  isPaid: {
    type: Boolean,
    default: true,
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
},
{
  timestamps:true,
});

module.exports=mongoose.model("Holiday",holidaySchema)