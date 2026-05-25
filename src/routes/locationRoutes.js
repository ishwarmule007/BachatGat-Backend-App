const express = require("express");
const fs = require("fs");
const path = require("path");

const Location = require("../models/location");

const router = express.Router();

router.post("/upload-locations", async(req, res) => {
    try {

        const filePath = path.join(
            process.cwd(),
            "src/data/location.json"
        );

        const jsonData = fs.readFileSync(filePath, "utf-8");

        const data = JSON.parse(jsonData);

        let bulkData = [];

        data.forEach((item) => {

            const { state, district, sub_districts } = item;

            sub_districts.forEach((sub) => {

                bulkData.push({
                    state,
                    district,
                    sub_District: sub,
                });

            });

        });

        await Location.insertMany(bulkData, {
            ordered: false,
        });

        res.status(200).json({
            success: true,
            message: "Locations uploaded successfully",
            totalInserted: bulkData.length,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
});

router.get("/states", async(req, res) => {
    try {

        const states = await Location.distinct("state");

        res.status(200).json({
            success: true,
            data: states,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
});

router.get("/districts/:state", async(req, res) => {
    try {

        const { state } = req.params;

        const districts = await Location.distinct("district", {
            state,
        });

        res.status(200).json({
            success: true,
            data: districts,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
});


router.get("/taluka/:state/:district", async(req, res) => {
    try {

        const { state, district } = req.params;

        const location = await Location.findOne({
            state,
            district,
        });

        res.status(200).json({
            success: true,
            data: location ? .sub_districts || [],
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
});
module.exports = router;