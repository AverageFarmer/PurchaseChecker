import React, { useState, useMemo, useEffect } from 'react';
import './GameList.css';

export default function GameList({ data, onLoadMore, canLoadMore, countdown }) {
  const [expanded, setExpanded] = useState({});
  const [tab, setTab] = useState("Games");
  const [animatedTotals, setAnimatedTotals] = useState({ total: 0, dev: 0, pass: 0 });

  const toggleExpand = (game) => {
    setExpanded((prev) => ({ ...prev, [game]: !prev[game] }));
  };

  const numberWithCommas = (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const totals = useMemo(() => {
    let total = 0, dev = 0, pass = 0;
    for (const info of Object.values(data)) {
      total += info.total;
      dev += info.devTotal;
      pass += info.passTotal;
    }
    return { total, dev, pass };
  }, [data]);

  const sortedGames = useMemo(() => {
    return Object.entries(data).sort((a, b) => b[1].total - a[1].total); // Descending sort
  }, [data]);

  useEffect(() => {
    const duration = 800;
    const frames = 60;
    const interval = duration / frames;
    const step = (target, current) => (target - current) / frames;

    let frame = 0;
    const start = { ...animatedTotals };
    const stepVals = {
      total: step(totals.total, start.total),
      dev: step(totals.dev, start.dev),
      pass: step(totals.pass, start.pass),
    };

    const anim = setInterval(() => {
      frame++;
      if (frame >= frames) {
        setAnimatedTotals(totals);
        clearInterval(anim);
      } else {
        setAnimatedTotals((prev) => ({
          total: prev.total + stepVals.total,
          dev: prev.dev + stepVals.dev,
          pass: prev.pass + stepVals.pass,
        }));
      }
    }, interval);

    return () => clearInterval(anim);
  }, [totals]);

  return (
    <div className="game-list">
      <div className="tab-buttons">
        <button
          onClick={() => setTab("Games")}
          className={tab === "Games" ? "tab-button active" : "tab-button"}
        >
          Games
        </button>
        <button
          onClick={() => setTab("Soon")}
          className={tab === "Soon" ? "tab-button active" : "tab-button"}
        >
          Soon!
        </button>
      </div>

      {tab === "Games" ? (
        <>
          {canLoadMore && (
            <button
              className={`load-more-btn ${countdown > 0 ? "countdown-anim" : ""}`}
              onClick={onLoadMore}
              disabled={countdown > 0}
            >
              {countdown > 0
                ? `Load more in ${countdown}s...`
                : "Load More Transactions"}
            </button>
          )}

          <div className="summary">
            <p>Total Spent: <span className="r-currency">{numberWithCommas(Math.round(animatedTotals.total))} R$ : ${numberWithCommas(Math.round(animatedTotals.total * .0035))}</span></p>
            <p>DevProducts: <span className="r-currency">{numberWithCommas(Math.round(animatedTotals.dev))} R$ : ${numberWithCommas(Math.round(animatedTotals.dev * .0035))}</span></p>
            <p>GamePasses: <span className="r-currency">{numberWithCommas(Math.round(animatedTotals.pass))} R$ : ${numberWithCommas(Math.round(animatedTotals.pass * .0035))}</span></p>
          </div>
          

          {sortedGames.map(([game, info]) => (
            <div key={game} className="game-entry">
              <button
                className="game-toggle"
                onClick={() => toggleExpand(game)}
              >
                {game} - <span className="r-currency">{numberWithCommas(info.total)} R$</span>
              </button>

              {expanded[game] && (
                <div className="game-details">
                  <p>Total DevProducts: <span className="r-currency">{numberWithCommas(info.devTotal)} R$</span></p>
                  <p>Total GamePasses: <span className="r-currency">{numberWithCommas(info.passTotal)} R$</span></p>
                  <ul>
                    {info.items.map((item, i) => (
                      <li key={i} className="game-item">
                        <span>{item.name} </span>
                        <span className="r-currency">{numberWithCommas(item.price)} R$</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </>
      ) : (
        <div className="coming-soon">Features coming soon...</div>
      )}
    </div>
  );
}
