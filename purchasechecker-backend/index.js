const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.post("/api/transactions", async (req, res) => {
  const { cookie, sort, cursor: initialCursor } = req.body;

  if (!cookie) return res.status(400).json({ error: "No cookie provided." });

  const headers = {
    "Cookie": `.ROBLOSECURITY=${cookie}`,
    "Content-Type": "application/json"
  };

  try {
    // Get user ID
    const userInfo = await fetch("https://users.roblox.com/v1/users/authenticated", { headers });
    if (!userInfo.ok) throw new Error(`Failed to authenticate user: ${userInfo.status}`);
    const userData = await userInfo.json();
    if (!userData.id) throw new Error("Invalid user ID");
    const userId = userData.id;

    // Fetch up to 2000 transactions (20 pages of 100)
    let transactions = [];
    let cursor = initialCursor || null;
    let pages = 0;
    let nextPageCursor = null;

    while (pages < 20 && transactions.length < 2000) {
      const url = new URL(`https://economy.roblox.com/v2/users/${userId}/transactions`);
      url.searchParams.set("transactionType", "Purchase");
      url.searchParams.set("limit", 100);
      if (cursor) url.searchParams.set("cursor", cursor);
      
      const pageRes = await fetch(url.toString(), { headers });
      const pageJson = await pageRes.json();

      console.log("Fetching transactions from:", url.toString());
      console.log("Response JSON:", JSON.stringify(pageJson, null, 2));

      if (!Array.isArray(pageJson.data)) break;

      transactions.push(...pageJson.data);
      cursor = pageJson.nextPageCursor;
      nextPageCursor = cursor || null;

      if (!cursor) break;
      pages++;

      await new Promise(resolve => setTimeout(resolve, 200)); // rate limit buffer
    }

    const dets = {};

    for (const tx of transactions) {
      const cost = Math.abs(tx.currency?.amount || 0);
      const type = tx.details?.type || "Unknown";
      const name = tx.details?.name || "Unknown item";
      const place = tx.details?.place?.name || "Other Products";

      if (!dets[place]) {
        dets[place] = {
          total: 0,
          devTotal: 0,
          passTotal: 0,
          items: []
        };
      }

      dets[place].total += cost;
      if (type === "DeveloperProduct") dets[place].devTotal += cost;
      if (type === "GamePass") dets[place].passTotal += cost;

      dets[place].items.push({ name, price: cost, type });
    }

    // Sort by total spent per game
    const sorted = Object.entries(dets)
      .sort((a, b) => sort === "asc" ? a[1].total - b[1].total : b[1].total - a[1].total)
      .reduce((obj, [key, val]) => (obj[key] = val, obj), {});

    res.json({
      data: sorted,
      nextPageCursor
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend live on port ${PORT}`);
});
