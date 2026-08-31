import { useEffect, useMemo, useState } from 'react';
import {
  openCashfreeCheckout,
  PREMIUM_PRICE_INR,
} from '../utils/payment';

const MISSION_KEY = 'trader_kavach_mission';
const JOURNAL_KEY = 'trader_kavach_journal';

const initialTicker = [
  {
    symbol: 'XAUUSD',
    price: 'Live',
    change: 'TradingView',
  },
  {
    symbol: 'EURUSD',
    price: 'Live',
    change: 'TradingView',
  },
  {
    symbol: 'BTCUSD',
    price: 'Live',
    change: 'TradingView',
  },
];

function money(value) {
  const number = Number(value || 0);

  return (
    'INR ' +
    number.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })
  );
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getMissionDay(startDate, totalDays) {
  if (!startDate || !totalDays) {
    return 0;
  }

  const start = new Date(startDate + 'T00:00:00');
  const today = new Date(getToday() + 'T00:00:00');

  const difference =
    Math.floor(
      (today.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return Math.max(
    0,
    Math.min(difference, Number(totalDays))
  );
}

function calculateLots(balance, riskPercent, stopLossPips) {
  const b = Number(balance);
  const r = Number(riskPercent);
  const sl = Number(stopLossPips);

  if (
    !b ||
    !r ||
    !sl ||
    b <= 0 ||
    r <= 0 ||
    sl <= 0
  ) {
    return 0.01;
  }

  const riskMoney = b * (r / 100);
  const lots = riskMoney / (sl * 10);

  return Math.min(100, Math.max(0.01, lots));
}

function createJournalEntry() {
  return {
    id: Date.now(),
    date: getToday(),
    symbol: 'XAUUSD',
    direction: 'BUY',
    result: 'PROFIT',
    amount: '',
    note: '',
  };
}

export default function Dashboard({
  user,
  isPremium,
  onPremiumActivated,
}) {
  const [balance, setBalance] = useState(10000);
  const [risk, setRisk] = useState(2);
  const [sl, setSl] = useState(30);

  const [mission, setMission] = useState(null);
  const [journal, setJournal] = useState([]);
  const [journalForm, setJournalForm] =
    useState(createJournalEntry());

  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState('');

  const [phone, setPhone] = useState(
    user?.phoneNumber || ''
  );

  const [activeSection, setActiveSection] =
    useState('overview');

  useEffect(() => {
    try {
      const savedMission = JSON.parse(
        localStorage.getItem(MISSION_KEY) || 'null'
      );

      const savedJournal = JSON.parse(
        localStorage.getItem(JOURNAL_KEY) || '[]'
      );

      if (savedMission) {
        setMission(savedMission);

        setBalance(
          Number(savedMission.startingCapital) || 10000
        );
      }

      if (Array.isArray(savedJournal)) {
        setJournal(savedJournal);
      }
    } catch (error) {
      console.error(
        'Trader Kavach local data load failed:',
        error
      );
    }
  }, []);

  useEffect(() => {
    function handleStorage() {
      try {
        const savedMission = JSON.parse(
          localStorage.getItem(MISSION_KEY) || 'null'
        );

        const savedJournal = JSON.parse(
          localStorage.getItem(JOURNAL_KEY) || '[]'
        );

        setMission(savedMission);

        if (Array.isArray(savedJournal)) {
          setJournal(savedJournal);
        }
      } catch (error) {
        console.error(
          'Storage update failed:',
          error
        );
      }
    }

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(
        'storage',
        handleStorage
      );
    };
  }, []);

  const lots = useMemo(
    () =>
      calculateLots(
        balance,
        risk,
        sl
      ),
    [balance, risk, sl]
  );

  const missionDay = mission
    ? getMissionDay(
        mission.startDate,
        mission.days
      )
    : 0;

  const totalDays = Number(
    mission?.days || 0
  );

  const dailyTarget = Number(
    mission?.dailyTarget || 0
  );

  const dailyLossLimit = Number(
    mission?.dailyLossLimit || 0
  );

  const profitRequired = Number(
    mission?.profitRequired || 0
  );

  const todayEntries = journal.filter(
    (entry) => entry.date === getToday()
  );

  const todayProfit = todayEntries.reduce(
    (total, entry) => {
      const amount = Number(entry.amount) || 0;

      if (entry.result === 'PROFIT') {
        return total + amount;
      }

      return total - amount;
    },
    0
  );

  const remainingTarget = Math.max(
    0,
    dailyTarget - todayProfit
  );

  const dailyLossUsed = Math.max(
    0,
    -todayProfit
  );

  const progressPercent =
    dailyTarget > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (todayProfit / dailyTarget) * 100
          )
        )
      : 0;

  let motivation =
    'Follow the plan. Do not trade every candle.';

  if (todayProfit > 0) {
    if (
      dailyTarget > 0 &&
      todayProfit >= dailyTarget
    ) {
      motivation =
        'Daily target achieved. Stop unnecessary trading and protect your capital.';
    } else {
      motivation =
        'You are in profit. Control greed and wait for the next quality setup.';
    }
  }

  if (todayProfit < 0) {
    motivation =
      'You are in loss. Do not revenge trade. Respect your daily risk limit.';
  }

  function saveJournalEntry() {
    const amount = Number(
      journalForm.amount
    );

    if (!amount || amount <= 0) {
      alert('Enter a valid trade amount.');
      return;
    }

    const entry = {
      ...journalForm,
      id: Date.now(),
      amount,
      date: getToday(),
    };

    const updated = [
      entry,
      ...journal,
    ];

    setJournal(updated);

    localStorage.setItem(
      JOURNAL_KEY,
      JSON.stringify(updated)
    );

    setJournalForm(createJournalEntry());
  }

  function deleteJournalEntry(id) {
    const updated = journal.filter(
      (entry) => entry.id !== id
    );

    setJournal(updated);

    localStorage.setItem(
      JOURNAL_KEY,
      JSON.stringify(updated)
    );
  }

  async function upgrade() {
    try {
      setNotice('');
      setPaying(true);

      await openCashfreeCheckout({
        user,
        phone,

        onSuccess: () => {
          setNotice(
            'Cashfree checkout complete. Premium verification started.'
          );

          if (onPremiumActivated) {
            onPremiumActivated();
          }
        },

        onError: (error) => {
          setNotice(
            error?.message ||
              'Payment process failed.'
          );
        },
      });
    } catch (error) {
      setNotice(
        error?.message ||
          'Payment process failed.'
      );
    } finally {
      setPaying(false);
    }
  }

  return (
    <main className="dashboard">

      <section className="ticker-wrap">
        <div className="ticker-track">
          {[
            ...initialTicker,
            ...initialTicker,
          ].map((item, index) => (
            <div
              className="ticker-item"
              key={
                item.symbol +
                '-' +
                index
              }
            >
              <strong>
                {item.symbol}
              </strong>

              <span>
                {item.price}
              </span>

              <small>
                {item.change}
              </small>
            </div>
          ))}
        </div>
      </section>

      <div className="dashboard-heading">

        <div>
          <span className="eyebrow">
            TRADER CONTROL CENTER
          </span>

          <h1>
            Good trading starts before the trade.
          </h1>

          <p>
            Welcome,{' '}
            {user?.displayName || 'Trader'}.
          </p>
        </div>

        <div
          className={
            'premium-pill ' +
            (isPremium ? 'premium' : '')
          }
        >
          {isPremium
            ? 'PREMIUM ACTIVE'
            : 'FREE PLAN'}
        </div>

      </div>

      {notice && (
        <div className="alert alert-info">
          {notice}
        </div>
      )}

      <nav className="dashboard-nav">

        <button
          className={
            activeSection === 'overview'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveSection('overview')
          }
        >
          Overview
        </button>

        <button
          className={
            activeSection === 'mission'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveSection('mission')
          }
        >
          Mission
        </button>

        <button
          className={
            activeSection === 'journal'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveSection('journal')
          }
        >
          Trade Journal
        </button>

        <button
          className={
            activeSection === 'calculator'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveSection('calculator')
          }
        >
          Risk Calculator
        </button>

      </nav>

      {activeSection === 'overview' && (
        <>
          <section className="stats-grid">

            <Stat
              label="Mission Day"
              value={
                mission
                  ? missionDay +
                    '/' +
                    totalDays
                  : 'Not Set'
              }
            />

            <Stat
              label="Today's Target"
              value={money(dailyTarget)}
              accent
            />

            <Stat
              label="Today's P/L"
              value={money(todayProfit)}
            />

            <Stat
              label="Daily Loss Limit"
              value={money(dailyLossLimit)}
            />

          </section>

          <section className="panel">

            <div className="panel-heading">

              <div>

                <span className="eyebrow">
                  DAILY CONTROL
                </span>

                <h2>
                  {mission
                    ? 'Day ' +
                      missionDay +
                      ' Trading Plan'
                    : 'Create Your Trading Mission'}
                </h2>

              </div>

            </div>

            {mission ? (
              <>

                <div className="mission-summary">

                  <div>
                    <span>
                      Starting Capital
                    </span>

                    <strong>
                      {money(
                        mission.startingCapital
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Target Capital
                    </span>

                    <strong>
                      {money(
                        mission.targetCapital
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total Profit Required
                    </span>

                    <strong>
                      {money(
                        profitRequired
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Remaining Today's Target
                    </span>

                    <strong>
                      {money(
                        remainingTarget
                      )}
                    </strong>
                  </div>

                </div>

                <div className="progress-container">

                  <div className="progress-bar">

                    <div
                      className="progress-fill"
                      style={{
                        width:
                          progressPercent +
                          '%',
                      }}
                    />

                  </div>

                  <small>
                    {Math.round(
                      progressPercent
                    )}
                    % of today's target
                  </small>

                </div>

                <div className="motivation-card">

                  <span className="eyebrow">
                    TRADER MINDSET
                  </span>

                  <h3>
                    {motivation}
                  </h3>

                </div>

                {todayProfit >=
                  dailyTarget &&
                  dailyTarget > 0 && (
                    <div className="alert alert-success">
                      Daily target achieved. Avoid unnecessary trades.
                    </div>
                  )}

                {dailyLossUsed >=
                  dailyLossLimit &&
                  dailyLossLimit > 0 && (
                    <div className="alert alert-danger">
                      Daily loss limit reached. Trading should stop for today.
                    </div>
                  )}

              </>
            ) : (
              <div className="empty-state">

                <h3>
                  Trading Mission is not set.
                </h3>

                <p>
                  Open Mission and set your capital,
                  target and duration.
                </p>

                <button
                  className="btn btn-primary"
                  onClick={() =>
                    setActiveSection('mission')
                  }
                >
                  Create Mission
                </button>

              </div>
            )}

          </section>
        </>
      )}

      {activeSection === 'mission' && (
        <section className="panel">

          <div className="panel-heading">

            <div>

              <span className="eyebrow">
                TRADING MISSION
              </span>

              <h2>
                Your Mission
              </h2>

            </div>

          </div>

          {mission ? (
            <div className="mission-summary">

              <div>
                <span>
                  Starting Capital
                </span>

                <strong>
                  {money(
                    mission.startingCapital
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Target Capital
                </span>

                <strong>
                  {money(
                    mission.targetCapital
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Mission Duration
                </span>

                <strong>
                  {mission.days} Days
                </strong>
              </div>

              <div>
                <span>
                  Start Date
                </span>

                <strong>
                  {mission.startDate}
                </strong>
              </div>

              <div>
                <span>
                  Daily Target
                </span>

                <strong>
                  {money(
                    mission.dailyTarget
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Daily Loss Limit
                </span>

                <strong>
                  {money(
                    mission.dailyLossLimit
                  )}
                </strong>
              </div>

            </div>
          ) : (
            <div className="empty-state">
              Mission is not available.
            </div>
          )}

        </section>
      )}

      {activeSection === 'journal' && (
        <section className="panel">

          <div className="panel-heading">

            <div>

              <span className="eyebrow">
                TRADE JOURNAL
              </span>

              <h2>
                Trading Journal
              </h2>

            </div>

          </div>

          <div className="calculator-form">

            <label>
              Symbol

              <input
                value={journalForm.symbol}
                onChange={(e) =>
                  setJournalForm({
                    ...journalForm,
                    symbol: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Direction

              <select
                value={
                  journalForm.direction
                }
                onChange={(e) =>
                  setJournalForm({
                    ...journalForm,
                    direction:
                      e.target.value,
                  })
                }
              >
                <option value="BUY">
                  BUY
                </option>

                <option value="SELL">
                  SELL
                </option>
              </select>
            </label>

            <label>
              Result

              <select
                value={journalForm.result}
                onChange={(e) =>
                  setJournalForm({
                    ...journalForm,
                    result:
                      e.target.value,
                  })
                }
              >
                <option value="PROFIT">
                  PROFIT
                </option>

                <option value="LOSS">
                  LOSS
                </option>
              </select>
            </label>

            <label>
              Amount

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="500"
                value={journalForm.amount}
                onChange={(e) =>
                  setJournalForm({
                    ...journalForm,
                    amount:
                      e.target.value,
                  })
                }
              />
            </label>

            <label>
              Trade Note

              <input
                value={journalForm.note}
                onChange={(e) =>
                  setJournalForm({
                    ...journalForm,
                    note: e.target.value,
                  })
                }
                placeholder="Reason for trade"
              />
            </label>

          </div>

          <button
            className="btn btn-primary"
            onClick={saveJournalEntry}
          >
            Save Trade
          </button>

          <div className="table-wrap">

            <table>

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Direction</th>
                  <th>Result</th>
                  <th>Amount</th>
                  <th>Note</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {journal.map((entry) => (
                  <tr key={entry.id}>

                    <td>
                      {entry.date}
                    </td>

                    <td>
                      {entry.symbol}
                    </td>

                    <td>
                      {entry.direction}
                    </td>

                    <td>
                      {entry.result}
                    </td>

                    <td>
                      {money(entry.amount)}
                    </td>

                    <td>
                      {entry.note}
                    </td>

                    <td>
                      <button
                        className="btn"
                        onClick={() =>
                          deleteJournalEntry(
                            entry.id
                          )
                        }
                      >
                        Delete
                      </button>
                    </td>

                  </tr>
                ))}

                {journal.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      No trades recorded yet.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}

      {activeSection === 'calculator' && (
        <section className="panel">

          <div className="panel-heading">

            <div>

              <span className="eyebrow">
                RISK ENGINE
              </span>

              <h2>
                Position Size Calculator
              </h2>

            </div>

          </div>

          <div className="calculator-form">

            <Field
              label="Account Balance"
              value={balance}
              onChange={setBalance}
            />

            <Field
              label="Risk per Trade (%)"
              value={risk}
              onChange={setRisk}
              step="0.1"
            />

            <Field
              label="Stop Loss (pips)"
              value={sl}
              onChange={setSl}
            />

          </div>

          <div className="result-box">

            <span>
              Recommended Position Size
            </span>

            <strong>
              {lots.toFixed(2)} LOTS
            </strong>

            <small>
              Generic FX pip-value assumption.
              Verify broker contract specifications,
              especially for XAUUSD.
            </small>

          </div>

        </section>
      )}

      {!isPremium && (
        <section className="panel premium-panel">

          <div className="panel-heading">

            <div>

              <span className="eyebrow">
                PREMIUM
              </span>

              <h2>
                Unlock Trader Kavach Premium
              </h2>

              <p>
                Complete trading planning and
                premium features.
              </p>

            </div>

          </div>

          <label className="payment-phone-label">
            Mobile Number

            <input
              type="tel"
              inputMode="numeric"
              maxLength="10"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 10)
                )
              }
              placeholder="10-digit mobile number"
            />
          </label>

          <button
            className="btn btn-primary"
            onClick={upgrade}
            disabled={paying}
          >
            {paying
              ? 'Opening Cashfree...'
              : 'Pay INR ' +
                PREMIUM_PRICE_INR +
                ' with Cashfree'}
          </button>

        </section>
      )}

    </main>
  );
}

function Stat({
  label,
  value,
  accent = false,
}) {
  return (
    <div
      className={
        'stat-card ' +
        (accent ? 'accent' : '')
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step = '1',
}) {
  return (
    <label>
      {label}

      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
      />
    </label>
  );
}