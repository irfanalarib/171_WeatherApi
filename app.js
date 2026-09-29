const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/lokasi", async (req, res) => {
    const apiKey = "KFdXaBID6b77iu2AjrHD";
    const { q, longitude, latitude } = req.query;
    const hasCoordinates = longitude !== undefined && latitude !== undefined;
    const search = hasCoordinates
        ? `${longitude},${latitude}`
        : String(q || "").trim();

    if (!search) {
        return res.status(400).json({ message: "Masukkan nama lokasi terlebih dahulu." });
    }

    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(search)}.json`;

    try {
        const response = await axios.get(url, {
            params: { key: apiKey, limit: 1, language: "id" }
        });
        const feature = response.data.features?.[0];

        if (!feature) {
            return res.status(404).json({ message: "Lokasi tidak ditemukan." });
        }

        const context = feature.context || [];
        const contextText = (...types) => {
            const item = context.find(entry => types.some(type => entry.id.startsWith(`${type}.`)));
            return item?.text || "Tidak tersedia";
        };
        const featureType = feature.place_type?.[0];
        const country = featureType === "country" ? feature.text : contextText("country");
        const province = featureType === "region" ? feature.text : contextText("region");
        const districtFromContext = contextText("neighborhood", "locality", "district");
        const districtTypes = ["neighborhood", "locality", "district"];
        const district = districtFromContext !== "Tidak tersedia"
            ? districtFromContext
            : districtTypes.includes(featureType) ? feature.text : "Tidak tersedia";
        const [lng, lat] = feature.geometry.coordinates;

        res.json({
            lokasi: feature.place_name || feature.text,
            negara: country,
            provinsi: province,
            kecamatan: district,
            longitude: lng,
            latitude: lat
        });

    } catch (error) {

        console.error(error.message);

        res.status(500).json({
            message: "Gagal mengambil data dari MapTiler"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});