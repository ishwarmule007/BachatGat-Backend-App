const axios = require("axios");

const geocodeVillage = async({ village, district, state }) => {
    try {
        const query = [
                village,
                district,
                state,
                "India"
            ]
            .filter(Boolean)
            .join(", ");

        const response = await axios.get(
            "https://nominatim.openstreetmap.org/search", {
                params: {
                    q: query,
                    format: "json",
                    addressdetails: 1,
                    limit: 5,
                    countrycodes: "in"
                },
                headers: {
                    "User-Agent": "BachatGatApp/1.0"
                },
                timeout: 10000
            }
        );

        if (!response.data || response.data.length === 0) {
            return {
                latitude: null,
                longitude: null
            };
        }

        let bestMatch = null;

        for (const location of response.data) {
            if (!location.lat || !location.lon) {
                continue;
            }

            const address = location.address || {};

            const districtMatches = !district ||
                (address.state_district &&
                    address.state_district.toLowerCase() === district.toLowerCase()) ||
                (address.county &&
                    address.county.toLowerCase() === district.toLowerCase());

            const stateMatches = !state ||
                (address.state &&
                    address.state.toLowerCase() === state.toLowerCase());

            if (districtMatches && stateMatches) {
                bestMatch = location;
                break;
            }
        }

        // Fallback to first valid result
        if (!bestMatch) {
            bestMatch = response.data.find(
                location => location.lat && location.lon
            );
        }

        if (!bestMatch) {
            return {
                latitude: null,
                longitude: null
            };
        }

        return {
            latitude: Number(bestMatch.lat),
            longitude: Number(bestMatch.lon)
        };

    } catch (error) {
        console.error("Geocoding Error:", error.message);

        return {
            latitude: null,
            longitude: null
        };
    }
};

module.exports = geocodeVillage;