```jsx
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'trader_kavach_mission';

export default function MissionSetup({ onSave, existingMission }) {
  const [startingCapital, setStartingCapital] = useState('');
  const [targetCapital, setTargetCapital] = useState('');
  const [days, setDays] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [dailyRiskPercent, setDailyRiskPercent] = useState('2');

  useEffect(() => {
    const saved =
      existingMission ||
      JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');

    if (saved) {
      setStartingCapital(saved.startingCapital || '');
      setTargetCapital(saved.targetCapital || '');
      setDays(saved.days || '30');
      setStartDate(
        saved.startDate ||
          new Date().toISOString().split('T')[0]
      );
      setDailyRiskPercent(
        saved.dailyRiskPercent || '2'
      );
    } else {
      setStartDate(
        new Date().toISOString().split('T')[0]
      );
    }
  }, [existingMission]);

  const starting = Number(startingCapital);
  const target = Number(targetCapital);
  const totalDays = Number(days);
  const riskPercent = Number(dailyRiskPercent);

  const profitRequired =
    target > starting
      ? target - starting
      : 0;

  const dailyTarget =
    profitRequired > 0 && totalDays > 0
      ? profitRequired / totalDays
      : 0;

  const dailyLossLimit =
    starting > 0 &&
    riskPercent > 0
      ? starting * (riskPercent / 100)
      : 0;

  function handleSubmit(e) {
    e.preventDefault();

    if (!starting || starting <= 0) {
      alert('Valid Starting Capital enter karo.');
      return;
    }

    if (!target || target <= starting) {
      alert(
        'Target Capital Starting Capital se bada hona chahiye.'
      );
      return;
    }

    if (!totalDays || totalDays < 1) {
      alert('Valid number of days enter karo.');
      return;
    }

    if (!riskPercent || riskPercent <= 0) {
      alert('Valid Daily Risk % enter karo.');
      return;
    }

    if (!startDate) {
      alert('Start Date select karo.');
      return;
    }

    const mission = {
      startingCapital: starting,
      targetCapital: target,
      days: totalDays,
      startDate,
      dailyRiskPercent: riskPercent,
      profitRequired,
      dailyTarget,
      dailyLossLimit,
      createdAt:
        existingMission?.createdAt ||
        new Date().toISOString(),
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(mission)
    );

    onSave?.(mission);

    alert(
      'Trading Mission successfully save ho gaya. 🎯'
    );
  }

  return (
    <section className="mission-setup panel">

      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            TRADING PLAN
          </span>

          <h2>🎯 Create Your Trading Mission</h2>

          <p>
            Capital, target, duration aur daily risk
            define karo.
          </p>
        </div>

        <span className="tool-tag">
          MISSION ENGINE
        </span>
      </div>

      <form
        className="calculator-form"
        onSubmit={handleSubmit}
      >

        <label>
          Starting Capital
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="10000"
            value={startingCapital}
            onChange={(e) =>
              setStartingCapital(e.target.value)
            }
          />
        </label>

        <label>
          Target Capital
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="20000"
            value={targetCapital}
            onChange={(e) =>
              setTargetCapital(e.target.value)
            }
          />
        </label>

        <label>
          Mission Days
          <input
            type="number"
            min="1"
            max="1000"
            placeholder="30 / 49 / 90"
            value={days}
            onChange={(e) =>
              setDays(e.target.value)
            }
          />

          <div className="mission-presets">
            {[30, 49, 60, 90].map((value) => (
              <button
                type="button"
                key={value}
                onClick={() =>
                  setDays(String(value))
                }
              >
                {value} Days
              </button>
            ))}
          </div>
        </label>

        <label>
          Daily Loss Risk (%)
          <input
            type="number"
            min="0.1"
            max="20"
            step="0.1"
            placeholder="2"
            value={dailyRiskPercent}
            onChange={(e) =>
              setDailyRiskPercent(e.target.value)
            }
          />
        </label>

        <label>
          Start Date
          <input
            type="date"
            value={startDate}
            onChange={(e) =>
              setStartDate(e.target.value)
            }
          />
        </label>

      </form>

      {profitRequired > 0 && totalDays > 0 && (
        <div className="mission-preview">

          <div>
            <span>Total Profit Required</span>
            <strong>
              ₹{profitRequired.toFixed(2)}
            </strong>
          </div>

          <div>
            <span>Average Daily Target</span>
            <strong>
              ₹{dailyTarget.toFixed(2)}
            </strong>
          </div>

          <div>
            <span>Daily Loss Limit</span>
            <strong>
              ₹{dailyLossLimit.toFixed(2)}
            </strong>
          </div>

        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmit}
      >
        Save Trading Mission 🎯
      </button>

    </section>
  );
}
```
