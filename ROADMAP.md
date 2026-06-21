# Roadmap

What's planned beyond the active integration work in `INTEGRATION_PLAN.md`.

This file is intentionally short and not a commitment to build any of it. It's a record of directions we've considered so future-you doesn't have to re-derive the menu. Each item has a "build when" trigger so you know what justifies starting it.

## Now

The active work. See `INTEGRATION_PLAN.md`. Shape-one integration of Signal Engine into Spread Sniper, surfaced in the dashboard.

## Next (after integration ships)

### Agent layer (shape two)

**What**: An LLM agent that wakes up at market open, reads the unified market state (Signal Engine context + Spread Sniper positions + scanner candidates), and makes a decision. Either auto-execute through Spread Sniper or surface a recommendation with reasoning.

**Build when**:
- Phase 1-4 of integration is complete and stable for at least 2 weeks.
- Spread Sniper is paper trading reliably with Signal Engine features enabled.
- You have a clear use case for the agent that the existing scanner can't do (judgment over disagreements, news context, regime transitions).

**Don't build when**:
- The integration is still flaky.
- The agent's "decision" would just rubber-stamp Spread Sniper's existing scanner output.

**Open design questions**:
- Auto-execute or recommend-only? Recommend-only is safer to start.
- What's the agent's authority? Position size cap, instrument whitelist, kill switch.
- How is the agent evaluated? Same combined-gate discipline as everything else, or different bar for judgment-based decisions?

### Live deployment of Spread Sniper

**What**: Move Spread Sniper from paper to live with real capital ($2,500 → $5,000 per its Phase 2 plan).

**Build when**:
- Paper trading with Signal Engine features shows meaningful results over 4+ weeks.
- Decay monitor stays green during paper period.
- Risk controls have been stress-tested.

**Don't build when**:
- You haven't paper-traded with the integration enabled long enough to see how it behaves through at least one vol spike.

## Later (real possibilities, not commitments)

### Intraday data

**What**: Sub-daily bars (1-minute or tick) for Signal Engine. Would enable testing news decay, mean reversion, intraday momentum at the horizons where edge actually lives.

**Build when**: You have budget for the data tier upgrade and a specific intraday thesis worth testing. Vague "maybe edge is intraday" doesn't justify the cost.

**Cost**: Polygon's options tier is already paid; intraday equity bars are an additional subscription.

### Options surface beyond daily IV

**What**: VIX term structure (VIX9D/VIX/VIX3M), 25-delta skew, 0DTE flow as Signal Engine features. Polygon options tier is already authorized.

**Build when**: A specific options-surface hypothesis is worth testing. Don't build the ingestion just because the data is available.

### Order flow / dark pool data

**What**: Net delta hedging pressure, retail vs institutional flow, dark pool prints.

**Build when**: You have institutional-grade budget. This data is expensive. Skip until at least the intraday and options-surface paths are exhausted.

### New instruments

**What**: Same engine, different ticker. Crypto vol, single-name dispersion, sector ETFs.

**Build when**: You've decided SPY at daily resolution is genuinely tapped out and the integration phase isn't going to change that.

## Never (or at least, not without a strong reason)

### Re-testing closed Signal Engine hypotheses with different parameters

The seven nulls are closed. Re-testing TOM with a different window, or news scoring with a different threshold, is the multiple-testing trap. The pre-registration discipline locks the verdicts.

### "Just one more" backtest knob

Same problem. Each backtest counts as a trial. The trial-counting policy exists. Honor it.

### A dashboard redesign

The dashboard works. Don't rebuild it for aesthetics. Add capability, don't churn UI.

## Open questions to revisit

These don't have answers yet and don't need answers now. Capturing them so future sessions don't think they're new.

- Should Signal Engine and Spread Sniper share a regime classifier in the long run, or is the disagreement valuable?
- If an agent layer ships, does Signal Engine's decay monitor watch the *agent's* track record same as it watches signal sources?
- Spread Sniper's existing dashboard (Streamlit) overlaps with the React dashboard. At some point one of them is redundant.
- The UI repo is not under git. Worth `git init` and pushing to a private remote before any more work goes into it.
