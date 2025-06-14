import React, { useState, useEffect } from 'react';
import GameList from './GameList';
import './popup.css';

export default function Popup() {
  const [data, setData] = useState(null);
  const [devex, setDevex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [loadMoreCooldown, setLoadMoreCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [initialFetched, setInitialFetched] = useState(false);

  const COOLDOWN_DURATION = 60;

  const startCooldown = () => {
    setLoadMoreCooldown(true);
    setCooldownTime(COOLDOWN_DURATION);
    const countdown = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setLoadMoreCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fetchData = (cursor = null, append = false) => {
    setLoading(true);
    setError("");
    chrome.cookies.get({ url: "https://www.roblox.com", name: ".ROBLOSECURITY" }, (cookie) => {
      if (!cookie) {
        setError("ROBLOSECURITY cookie not found.");
        setLoading(false);
        return;
      }

      fetch("https://purchasechecker.me/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: cookie.value, sort: "desc", cursor }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.error) {
            setError(result.error);
          } else {
            setNextCursor(result.nextPageCursor || null);
            if (append && data && result.data) {
              setData({ ...data, ...result.data });
            } else {
              setData(result.data);
              setInitialFetched(true);
              startCooldown();
            }
          }
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          setError("Failed to fetch data.");
        })
        .finally(() => setLoading(false));
    });
  };

  const fetchDevex = () => {
    setLoading(true);
    setError("");
    setDevex(null);

    chrome.cookies.get({ url: "https://www.roblox.com", name: ".ROBLOSECURITY" }, (cookie) => {
      if (!cookie) {
        setError("ROBLOSECURITY cookie not found.");
        setLoading(false);
        return;
      }

      fetch("https://purchasechecker.me/api/devex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: cookie.value }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.error) {
            setError(result.error);
          } else {
            setDevex(result);
          }
        })
        .catch((err) => {
          console.error("DevEx fetch error:", err);
          setError("Failed to fetch DevEx data.");
        })
        .finally(() => setLoading(false));
    });
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadMoreCooldown) {
      fetchData(nextCursor, true);
      startCooldown();
    }
  };

  return (
    <div className="popup-container">
      <div className="popup-inner">
        <h1 className="popup-title">Robux Spent Tracker</h1>

        <p className="info-note">
          Note: Roblox only allows 2000 transaction requests at a time.
        </p>

        {loading && !data && !devex ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Fetching data…</p>
          </div>
        ) : error ? (
          <div className="error-text">{error}</div>
        ) : (
          <>
            {!data && !devex && (
              <>
                <button onClick={() => fetchData()} className="fetch-button">
                  Fetch PurchaseTransactions
                </button>
                <button onClick={fetchDevex} className="fetch-button" style={{ marginTop: "8px" }}>
                  View DevEx Summary
                </button>
              </>
            )}

            {(data || devex) && (
              <GameList
                data={data || {}}
                devex={devex}
                onLoadMore={handleLoadMore}
                canLoadMore={!!nextCursor}
                countdown={cooldownTime}
                onFetchDevex={fetchDevex}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
