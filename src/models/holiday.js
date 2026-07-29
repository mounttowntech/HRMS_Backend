const mongoose=require("mongoose");
const holidaySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },

  name: {
    type: String,
    required: true,
  },
  
  date: {
    type: Date,
    required: true,
  },

  type: {
    type: String,
    enum: [
      "national",
      "festival",
      "company",
    ],
    default: "company",
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