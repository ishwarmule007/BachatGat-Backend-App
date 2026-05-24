const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
    state: String,
    district: String,
    subDistrict: String,
});

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;