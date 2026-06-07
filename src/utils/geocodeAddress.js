const axios = require("axios");

const geocodeAddress = async({
    village,
    taluka,
    district,
    state
}) => {
    try {

        const response = await axios.get(
            "https://nominatim.openstreetmap.org/search", {
                params: {
                    village,
                    county: taluka,
                    state,
                    country: "India",
                    format: "json",
                    limit: 5,
                    addressdetails: 1
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

        const exactMatch = response.data.find(item =>
            item.address && item.address.village && item.address.village.toLowerCase() === village.toLowerCase()
        );

        const location = exactMatch || response.data[0];

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

module.exports = geocodeAddress;