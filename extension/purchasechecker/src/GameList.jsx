

import React, { useState, useMemo, useEffect } from 'react';
import './GameList.css';

export default function GameList({ data }) {
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

  useEffect(() => {
    const duration = 6000;
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
          <div className="summary">
            <p>Total Spent: <span className="r-currency">{numberWithCommas(Math.round(animatedTotals.total))} R$</span></p>
            <p>DevProducts: <span className="r-currency">{numberWithCommas(Math.round(animatedTotals.dev))} R$</span></p>
            <p>GamePasses: <span className="r-currency">{numberWithCommas(Math.round(animatedTotals.pass))} R$</span></p>
          </div>

          {Object.entries(data).map(([game, info]) => (
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
