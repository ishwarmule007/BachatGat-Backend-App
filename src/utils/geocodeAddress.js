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
                    limit: 10,
                    addressdetails: 1,
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

        const matched = response.data.find(item => {

            const address = item.address || {};

            const placeName =
                address.village ||
                address.town ||
                address.city ||
                "";

            const county =
                address.county ||
                "";

            const stateDistrict =
                address.state_district ||
                "";

            return (
                placeName.toLowerCase().includes(village.toLowerCase()) &&
                (
                    county.toLowerCase().includes(taluka.toLowerCase()) ||
                    stateDistrict.toLowerCase().includes(district.toLowerCase())
                ) &&
                address.state &&
                address.state.toLowerCase().includes(state.toLowerCase())
            );
        });

        const location = matched || response.data[0];

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