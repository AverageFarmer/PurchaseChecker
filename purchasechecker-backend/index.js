const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const noblox = require("noblox.js");

const app = express();
const PORT = 3000;

// Middleware
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
      const type = tx.details.type;
      const name = tx.details.name || "Unknown item";
      const place = tx.details.place?.name || "Unknown";

      if (!dets[place]) {
        dets[place] = {
          total: 0,
          devTotal: 0,
          passTotal: 0,
          items: []
        };
      }

      dets[place].total += cost;

      if (type === "DeveloperProduct") {
        dets[place].devTotal += cost;
      } else if (type === "GamePass") {
        dets[place].passTotal += cost;
      }

      dets[place].items.push({
        name,
        price: cost,
        type
      });
    }

    const sorted = Object.entries(dets)
      .sort((a, b) => sort === "asc" ? a[1].total - b[1].total : b[1].total - a[1].total)
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
    console.log(`Backend live on port ${PORT}`);
});