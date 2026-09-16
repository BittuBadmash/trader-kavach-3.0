import { useEffect } from 'react';

const pages = {
  '/trading-risk-calculator': {
    title: 'Trading Risk Calculator | Trader Kavach',
    description: 'Calculate maximum planned trade risk from account balance and risk percentage before entering a trade.',
    h1: 'Trading Risk Calculator',
    intro: 'Trader Kavach helps traders calculate the maximum amount they plan to risk on a trade before deciding position size. Start with account balance and a chosen risk percentage, then keep the result visible during trade planning.',
    sections: [
      ['Why calculate risk before a trade?', 'A defined maximum loss makes position sizing a risk decision rather than a guess. The planned risk amount should be established before the order is placed.'],
      ['Basic risk formula', 'Maximum planned risk = account balance × risk percentage ÷ 100. For example, a $1,000 account at 1% risk has a planned risk amount of $10, before transaction costs and execution differences.'],
      ['Use the calculator', 'Enter your account balance and intended risk percentage in the Trader Kavach dashboard. Use the result together with your stop-loss distance and instrument specifications when determining position size.']
    ]
  },
  '/position-size-calculator': {
    title: 'Position Size Calculator | Trader Kavach',
    description: 'Understand position sizing using account balance, risk percentage and stop-loss distance with Trader Kavach.',
    h1: 'Position Size Calculator',
    intro: 'Position sizing connects your planned monetary risk to the distance between entry and stop loss. Trader Kavach provides calculation tools so traders can plan a position before execution.',
    sections: [
      ['What is position sizing?', 'Position size is the amount of an instrument you trade. A smaller position can be appropriate when the stop-loss distance is wider if the monetary risk is kept constant.'],
      ['Core relationship', 'For a fixed account risk, increasing stop-loss distance generally requires a smaller position, while decreasing the distance generally permits a larger position. Exact calculations depend on the instrument contract and account currency.'],
      ['Before execution', 'Confirm the broker symbol specifications, tick or pip value, contract size and minimum lot size. Do not rely on a generic formula when the instrument specification differs.']
    ]
  },
  '/forex-risk-calculator': {
    title: 'Forex Risk Calculator | Trader Kavach',
    description: 'Plan Forex trade risk, stop-loss exposure and position size using a structured risk calculation process.',
    h1: 'Forex Risk Calculator',
    intro: 'Forex risk planning starts with the amount of account capital you are willing to expose and the stop-loss distance of the setup. Trader Kavach organizes these inputs into a pre-trade calculation workflow.',
    sections: [
      ['Forex risk inputs', 'Typical inputs include account balance, risk percentage, entry price, stop-loss price, currency pair, pip distance and pip value.'],
      ['Why pip value matters', 'The monetary value of a pip varies with the traded pair, position size and account currency. Verify the broker or platform specification before placing an order.'],
      ['Risk first', 'Choose the maximum planned loss first. Then work backward to a position size that fits that limit rather than selecting lot size first and discovering the risk afterward.']
    ]
  },
  '/xauusd-risk-calculator': {
    title: 'XAUUSD Risk Calculator | Gold Trading Risk | Trader Kavach',
    description: 'Plan XAUUSD and gold trade risk using account balance, risk percentage and stop-loss distance.',
    h1: 'XAUUSD Risk Calculator',
    intro: 'Gold can move quickly and broker contract specifications can differ. Trader Kavach gives XAUUSD traders a structured place to plan account risk and stop-loss exposure before execution.',
    sections: [
      ['Gold risk planning', 'For XAUUSD, confirm the broker symbol specification, contract size, tick size and tick value. These details determine how price movement translates into monetary profit or loss.'],
      ['Example workflow', 'Set the account balance, choose a maximum risk percentage, define the technical stop-loss level and calculate the corresponding monetary risk. Only then select the position size supported by your broker.'],
      ['Important check', 'XAUUSD specifications are broker-dependent. Treat the calculator output as a planning aid and verify the final value in your trading platform before execution.']
    ]
  },
  '/risk-reward-calculator': {
    title: 'Risk Reward Calculator | Trader Kavach',
    description: 'Calculate and understand risk-to-reward relationships for planned trades with Trader Kavach.',
    h1: 'Risk-Reward Calculator',
    intro: 'Risk-to-reward compares the amount a trade plans to risk with the amount it plans to target. It is one part of a complete trading plan, not a guarantee of an outcome.',
    sections: [
      ['Basic calculation', 'Risk-to-reward can be expressed as planned risk divided by planned reward, or described as a reward multiple such as 2R when the target is twice the planned risk.'],
      ['Example', 'If a trade plans to risk $20 and targets $40 before costs, the target represents 2R relative to the planned risk. Actual results can differ because of execution, spread, slippage and market movement.'],
      ['Use with win rate', 'Risk-reward should be evaluated together with the strategy rules, win rate, costs and execution quality. A high reward multiple by itself does not make a strategy profitable.']
    ]
  },
  '/trading-capital-management': {
    title: 'Trading Capital Management | Trader Kavach',
    description: 'Learn a structured approach to trading capital management, risk limits and drawdown planning.',
    h1: 'Trading Capital Management',
    intro: 'Capital management is the process of controlling how much trading capital is exposed to individual trades and periods of losses. Trader Kavach keeps capital and risk calculations together in one workflow.',
    sections: [
      ['Set a risk budget', 'Define the maximum amount or percentage that can be exposed on an individual trade and, where appropriate, a daily loss limit.'],
      ['Track drawdown', 'Drawdown measures decline from a previous equity or capital peak. Tracking it can help a trader recognize when normal trading conditions have changed or when risk needs to be reviewed.'],
      ['Protect repeatability', 'A position size that can survive a sequence of losses is more repeatable than one based on the desire to recover losses quickly. Risk rules should be decided before emotional pressure appears.']
    ]
  },
  '/trading-plan': {
    title: 'Trading Plan Guide | Trader Kavach',
    description: 'Build a structured trading plan covering setup rules, risk, entries, exits and review.',
    h1: 'Trading Plan',
    intro: 'A trading plan turns a trading idea into explicit rules for market selection, setup conditions, risk, execution and review. Trader Kavach is designed to support the risk and planning part of that process.',
    sections: [
      ['What a plan can contain', 'Define instruments, trading sessions, setup conditions, entry triggers, stop-loss rules, target rules, position-sizing rules and conditions for stopping for the day.'],
      ['Pre-trade checklist', 'Before an order, confirm the setup, entry, stop loss, planned risk, position size, reward target and whether the trade follows your predefined rules.'],
      ['Review after execution', 'Record the trade and compare the result with the original plan. Separating execution quality from outcome helps make reviews more useful.']
    ]
  },
  '/trading-journal': {
    title: 'Trading Journal Guide | Trader Kavach',
    description: 'Use a trading journal to record setups, risk, results and execution quality.',
    h1: 'Trading Journal',
    intro: 'A trading journal creates a record of decisions and outcomes. Trader Kavach includes journaling features so traders can review execution rather than relying only on memory.',
    sections: [
      ['What to record', 'Useful fields include date, instrument, direction, entry, stop loss, target, position size, planned risk, result and a short note about the setup.'],
      ['Review patterns', 'After enough trades, group results by setup, instrument, session or execution error. This can reveal recurring behavior that is difficult to notice from individual trades.'],
      ['Keep outcome and process separate', 'A profitable trade can still violate the plan, and a losing trade can follow the plan correctly. Record both the financial result and execution quality.']
    ]
  }
};

const related = [
  ['/trading-risk-calculator', 'Trading Risk Calculator'],
  ['/position-size-calculator', 'Position Size Calculator'],
  ['/forex-risk-calculator', 'Forex Risk Calculator'],
  ['/xauusd-risk-calculator', 'XAUUSD Risk Calculator'],
  ['/risk-reward-calculator', 'Risk-Reward Calculator'],
  ['/trading-capital-management', 'Trading Capital Management'],
  ['/trading-plan', 'Trading Plan'],
  ['/trading-journal', 'Trading Journal']
];

export function isSeoPath(path) {
  return Boolean(pages[path]);
}

export default function SeoPage({ path }) {
  const page = pages[path];

  useEffect(() => {
    if (!page) return;
    document.title = page.title;
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = page.description;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `https://traderkavach.in${path}`;
  }, [page, path]);

  if (!page) return null;

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '64px 20px 80px' }}>
      <article style={{ background: 'rgba(15,23,42,.78)', border: '1px solid rgba(148,163,184,.15)', borderRadius: 24, padding: 'clamp(24px,5vw,56px)', boxShadow: '0 20px 60px rgba(0,0,0,.18)' }}>
        <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 800, letterSpacing: 1.5, marginBottom: 12 }}>TRADER KAVACH · TRADING EDUCATION & RISK MANAGEMENT</div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,54px)', lineHeight: 1.08, margin: '0 0 20px', color: '#f8fafc' }}>{page.h1}</h1>
        <p style={{ color: '#cbd5e1', fontSize: 18, lineHeight: 1.7, maxWidth: 800, marginBottom: 38 }}>{page.intro}</p>

        {page.sections.map(([heading, text]) => (
          <section key={heading} style={{ marginTop: 34 }}>
            <h2 style={{ color: '#f8fafc', fontSize: 25, marginBottom: 10 }}>{heading}</h2>
            <p style={{ color: '#cbd5e1', lineHeight: 1.75, margin: 0 }}>{text}</p>
          </section>
        ))}

        <section style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(148,163,184,.15)' }}>
          <h2 style={{ color: '#f8fafc', fontSize: 25 }}>Explore Trader Kavach tools</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
            {related.filter(([href]) => href !== path).map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#f8fafc', textDecoration: 'none', border: '1px solid rgba(245,158,11,.35)', borderRadius: 999, padding: '10px 14px', background: 'rgba(245,158,11,.06)' }}>{label}</a>
            ))}
          </div>
        </section>

        <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7, marginTop: 38 }}>Trader Kavach provides calculation and planning tools. It is not financial advice, and calculations should be verified against your broker's instrument specifications before execution.</p>
      </article>
    </main>
  );
}
