const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const noblox = require("noblox.js");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.post("/api/transactions", async (req, res) => {
    const { cookie, sort } = req.body;

    if (!cookie) return res.status(400).json({ error: "No cookie provided." });

    try {
        await noblox.setCookie(cookie);
        const transactions = await noblox.getUserTransactions("Purchase", 2000);

        const dets = {};

        for (const tx of transactions) {
            const cost = Math.abs(tx.currency.amount);
            const place = tx.details.place?.name || "Unknown";
            if (!dets[place]) dets[place] = 0;
            dets[place] += cost;
        }

        const sorted = Object.entries(dets)
            .sort((a, b) => sort === "asc" ? a[1] - b[1] : b[1] - a[1])
            .reduce((obj, [key, val]) => {
                obj[key] = val;
                return obj;
            }, {});

        res.json(sorted);
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: "Failed to fetch transactions." });
    }
});

app.listen(PORT, () => {
    console.log(`Backend: ${PORT}`);
});
