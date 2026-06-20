const axios = require("axios");

const geocodeVillage = async({
    village,
    district,
    state
}) => {
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
                    limit: 1,
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

        const location = response.data[0];

        return {
            latitude: Number(location.lat),
            longitude: Number(location.lon)
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