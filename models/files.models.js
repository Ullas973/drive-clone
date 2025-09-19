const mongoose = require ("mongoose");
const user = require("./user.model");

const fileSchema = new mongoose.Schema({
  path: {
    type: String,
    required: [true, "path is required"],
  },
  originalname: {
    type: String,
    required: [true, "originalname is required"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users", //the collection type in mong db whic we are referring is name as users
    required: [true, "user is required"],
  },
});
const file = mongoose.model("file",fileSchema)
module.exports = file;
