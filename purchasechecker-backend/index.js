const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Purchase transaction endpoint
app.post("/api/transactions", async (req, res) => {
  const { cookie, sort, cursor: initialCursor } = req.body;
  if (!cookie) return res.status(400).json({ error: "No cookie provided." });

  const headers = {
    "Cookie": `.ROBLOSECURITY=${cookie}`,
    "Content-Type": "application/json"
  };

  try {
    const userInfo = await fetch("https://users.roblox.com/v1/users/authenticated", { headers });
    if (!userInfo.ok) throw new Error(`Failed to authenticate user: ${userInfo.status}`);
    const userData = await userInfo.json();
    const userId = userData.id;

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

      if (!Array.isArray(pageJson.data)) break;

      transactions.push(...pageJson.data);
      cursor = pageJson.nextPageCursor;
      nextPageCursor = cursor || null;

      if (!cursor) break;
      pages++;
      await new Promise(resolve => setTimeout(resolve, 200));
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

app.post("/api/devex", async (req, res) => {
  const { cookie } = req.body;
  if (!cookie) return res.status(400).json({ error: "No cookie provided." });

  const headers = {
    "Cookie": `.ROBLOSECURITY=${cookie}`,
    "Content-Type": "application/json"
  };

  try {
    const userInfo = await fetch("https://users.roblox.com/v1/users/authenticated", { headers });
    if (!userInfo.ok) throw new Error(`Failed to authenticate user: ${userInfo.status}`);
    const userData = await userInfo.json();
    const userId = userData.id;

    let devexTotalRobux = 0;
    let devexCursor = null;
    let devexPages = 0;

    while (devexPages < 10) {
      const devexUrl = new URL(`https://economy.roblox.com/v2/users/${userId}/transactions`);
      devexUrl.searchParams.set("transactionType", "DevEx");
      devexUrl.searchParams.set("limit", 100);
      if (devexCursor) devexUrl.searchParams.set("cursor", devexCursor);

      const devexRes = await fetch(devexUrl.toString(), { headers });
      const devexJson = await devexRes.json();

      console.log(devexJson)

      if (!devexJson.data) break;

      console.log("passed")
      for (const tx of devexJson.data) {
        if (tx.details.status === "Completed") {
          devexTotalRobux += Math.abs(tx.currency.amount || 0);
        }
      }

      devexCursor = devexJson.nextPageCursor;
      if (!devexCursor) break;
      devexPages++;
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    const devexUSD = (devexTotalRobux * 0.0035).toFixed(2);

    res.json({
      robux: devexTotalRobux,
      usd: parseFloat(devexUSD)
    });
  } catch (err) {
    console.error("DevEx error:", err);
    res.status(500).json({ error: "Failed to fetch DevEx history." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend live on port ${PORT}`);
});
