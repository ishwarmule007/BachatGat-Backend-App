const express = require("express");
const fs = require("fs");
const path = require("path");

const Location = require("../models/location");

const router = express.Router();
/**
 * @swagger
 * /api/locations/upload-locations:
 *   post:
 *     summary: Upload location master data into database
 *     description: |
 *       This API uploads all states, districts and talukas from the local JSON file into MongoDB.
 *       
 *        Important:
 *       - Use this API only one time for initial database seeding.
 *       - Do not call this API repeatedly, otherwise duplicate records may get inserted.
 *       - Recommended only for development/setup purposes.
 *     tags: [Location]
 *     responses:
 *       200:
 *         description: Locations uploaded successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Locations uploaded successfully
 *               totalInserted: 4664
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Error message
 */
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
                    sub_district: sub,
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
/**
 * @swagger
 * /api/locations/states:
 *   get:
 *     summary: Get all states and union territories
 *     description: Returns list of all distinct states and union territories available in database.
 *     tags: [Location]
 *     responses:
 *       200:
 *         description: List of states fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - Madhya Pradesh
 *                 - Maharashtra
 *                 - Gujarat
 *                 - Rajasthan
 *       500:
 *         description: Internal server error
 */
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
/**
 * @swagger
 * /api/locations/districts/{state}:
 *   get:
 *     summary: Get all districts of a state
 *     description: Returns all districts for the provided state.
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         example: Madhya Pradesh
 *     responses:
 *       200:
 *         description: Districts fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - Indore
 *                 - Bhopal
 *                 - Khargone
 *       500:
 *         description: Internal server error
 */
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
/**
 * @swagger
 * /api/locations/taluka/{state}/{district}:
 *   get:
 *     summary: Get all talukas of a district
 *     description: Returns all talukas/sub-districts for the provided state and district.
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         example: Madhya Pradesh
 *       - in: path
 *         name: district
 *         required: true
 *         schema:
 *           type: string
 *         example: Khargone
 *     responses:
 *       200:
 *         description: Talukas fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - Barwaha
 *                 - Bhagwanpura
 *                 - Bhikangaon
 *                 - Kasrawad
 *                 - Maheshwar
 *       500:
 *         description: Internal server error
 */
router.get("/taluka/:state/:district", async(req, res) => {
    try {
        const { state, district } = req.params;
        const subDistricts = await Location.distinct("sub_district", {
            state,
            district,
        });
        res.status(200).json({
            data: subDistricts,
            success: true,
        });
    } catch {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
module.exports = router;