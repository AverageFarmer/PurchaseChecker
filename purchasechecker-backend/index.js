const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

async function fetchAllTransactions(cookie, sort) {
  const headers = {
    "Cookie": `.ROBLOSECURITY=${cookie}`,
    "Content-Type": "application/json"
  };

  const userInfo = await fetch("https://users.roblox.com/v1/users/authenticated", { headers });
 
  if (!userInfo.ok) {
    throw new Error(`Failed to authenticate user: ${userInfo.status}`);
  }

  const userData = await userInfo.json();

  if (!userData.id) {
    throw new Error("Could not retrieve valid user ID. Cookie may be invalid.");
  }

  const userId = userData.id;
  let cursor = null;
  let allTransactions = [];
  let retry = 0;

  console.log("User ID fetched:", userId);

  do {
    const url = new URL(`https://economy.roblox.com/v2/users/${userId}/transactions`);
    url.searchParams.set("transactionType", "Purchase");
    url.searchParams.set("limit", 100);
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), { headers });
    const text = await res.text();

    try {
      const json = JSON.parse(text);
      console.log("Fetching transactions from:", url.toString());
      console.log("Response JSON:", JSON.stringify(json, null, 2));

      if (Array.isArray(json.data)) {
        allTransactions = allTransactions.concat(json.data);
        cursor = json.nextPageCursor;
        retry = 0; // reset retry if successful
      } else {
        if (++retry > 2) break;
      }
    } catch (err) {
      console.error("Failed to parse JSON:", text);
      if (++retry > 2) break;
    }

  } while (cursor);

  console.warn("Fetched", allTransactions.length, "transactions.");
  return allTransactions;
}

app.post("/api/transactions", async (req, res) => {
  const { cookie, sort } = req.body;

  if (!cookie) return res.status(400).json({ error: "No cookie provided." });

  try {
    const transactions = await fetchAllTransactions(cookie, sort);
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

    res.json(sorted);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend live on port ${PORT}`);
});
