const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
    state: String,
    district: String,
    sub_district: String,
});

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;