# Context

The three repos that make up this work. Read this first in any new claude code session.

## The repos

### spread-sniper-ui (this repo)
**Path**: `/Users/zona/Documents/spread-sniper-ui`
**What it is**: React + TypeScript + Vite dashboard with Express API server.
**What it does today**: Displays Spread Sniper trade data and Signal Engine snapshot (regime, vol, news, FOMC, predictions, decay alerts).
**Notes**: Not a git repo at time of writing — work lives only on local disk. Worth `git init` and pushing to a private remote if you care about backup.

### spread-sniper
**Path**: `/Users/zona/spread-sniper`
**What it is**: Full ML-powered options credit spread trading system. Python. ~549 tests.
**What it does**: Live and paper trading for SPY/QQQ/IWM credit spreads (0DTE, monthly, momentum debits, earnings plays). Has its own regime classifier (LightGBM), IV-RV filter, VIX backwardation kill switch, position correlation limits, quarter-Kelly sizing. TimescaleDB-backed, alerts via terminal/file/Telegram.
**Status**: Phase 1 complete (data + paper trading). Phase 2 (live) and beyond pending. Source of execution capability.

### signal-engine
**Path**: `/Users/zona/PycharmProjects/signal-engine`
**What it is**: SPY research instrument. Python. ~434 tests.
**What it does**: Daily-resolution hypothesis testing through a verified honesty layer (CPCV, DSR ≥ 0.95 AND PBO ≤ 0.25 combined gate). 3-state Gaussian HMM regime detector validated against 2018/2020/2022 stress. LLM news scoring and FOMC analyzer with lookahead-safe evaluation. Daily scheduler running 3x/day via launchd.
**Status**: Research phase closed as of 2026-06-21. Twelve hypotheses tested, all closed. VRP exists in regression (β1=0.79, p<0.0001) but no tradeable implementation found. The infrastructure (gate, pre-registration discipline, regime detector, decay monitor) is portable.

## Shared database

All three repos point at the same TimescaleDB container (`sniper-db`, port 5432) for the data tier. Schemas:

- `public` — Spread Sniper tables (`market_data`, `options_chains`, `features`, `trades`, `regime_history`, `sentiment_scores`)
- `signal_engine` — Signal Engine tables (`prices`, `macro`, `news`, `news_scores`, `fomc_events`, `regimes`, `predictions`, `realized`, `decay_alerts`, etc.)

Namespace isolation. Spread Sniper's regime model and Signal Engine's HMM produce independent labels — they can disagree, and discovering when they disagree is part of the integration work.

## Why these are connected

Signal Engine spent months proving that daily-resolution public-information signals don't pass an honest gate for SPY direction. That's a real result. What Signal Engine *did* produce that's valuable:

- A verified honesty layer (catches phantom returns, timezone bugs, multiple-testing inflation)
- A validated regime detector
- An LLM news/FOMC scorer with lookahead-safe evaluation
- A daily snapshot of market context (regime, vol, news, FOMC, predictions)

Spread Sniper *trades*. It has its own regime classifier, its own IV-RV calculation, its own scanner. It doesn't currently consume Signal Engine output.

The integration phase wires Signal Engine's context into Spread Sniper as additional features and decision inputs. Not to replace Spread Sniper's logic but to give it a richer view. See `INTEGRATION_PLAN.md`.

## Discipline carried over from Signal Engine

The Signal Engine project caught ten distinct load-bearing bugs by refusing to trust summaries on numbers that drive decisions. That discipline transfers:

- **Verify load-bearing numbers against ground truth.** Don't accept "looks right" on metrics that decide what trades.
- **Pre-register before looking at results.** Any new strategy gets a protocol doc committed before backtesting.
- **Combined gate is non-negotiable.** DSR ≥ 0.95 AND PBO ≤ 0.25 for any signal claimed as tradeable edge. DSR alone is too easy to fool.
- **Narrow the claim to what was tested.** "This configuration on this sample" not "this thesis is dead/alive."
- **Honest nulls beat fake wins.** Closing a hypothesis with a clean fail is a real result.

The claude skill at `.claude/skills/spread-sniper-signal-engine-integration/SKILL.md` encodes this discipline for integration work.

## Where to look for what

| You want to know about | Read |
|---|---|
| Current state of all three repos | This file |
| What we're building now | `INTEGRATION_PLAN.md` |
| What's planned after integration | `ROADMAP.md` |
| How claude code should approach integration tasks | `.claude/skills/spread-sniper-signal-engine-integration/SKILL.md` |
| Signal Engine's research findings | `/Users/zona/PycharmProjects/signal-engine/FINDINGS.md` |
| Signal Engine's full history (bugs, decisions) | `/Users/zona/PycharmProjects/signal-engine/HANDOFF.md` |
| Signal Engine's combined gate policy | `/Users/zona/PycharmProjects/signal-engine/docs/DSR_TRIAL_COUNTING_POLICY.md` |
| Spread Sniper architecture and strategies | `/Users/zona/spread-sniper/README.md` |
