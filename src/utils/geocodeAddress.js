const axios = require("axios");

const geocodeAddress = async({
    village,
    taluka,
    district,
    state
}) => {
    try {
        const query = [
                village,
                taluka,
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

        if (!response.data ? response.data.length || 0 : 0) {
            return {
                latitude: null,
                longitude: null
            };
        }

        return {
            latitude: Number(response.data[0].lat),
            longitude: Number(response.data[0].lon)
        };
    } catch (error) {
        console.error("Geocoding Error:", error.message);

        return {
            latitude: null,
            longitude: null
        };
    }
};

module.exports = geocodeAddress;