# Integration Plan

The concrete shape-one work: Signal Engine becomes Spread Sniper's context provider. Dashboard surfaces the unified view.

Read `CONTEXT.md` first. Read this for the active work.

## What "done" looks like

When this is complete:
- Signal Engine exposes a single market-state API endpoint with everything Spread Sniper might want.
- Spread Sniper reads that endpoint and uses Signal Engine's regime label, IV-RV spread, news sentiment, FOMC stance, and decay alerts as additional inputs alongside its existing logic.
- The dashboard shows Signal Engine and Spread Sniper state side-by-side, including any cases where their independent regime classifiers disagree.
- All of this is testable, observable, and reversible (Spread Sniper can run with or without Signal Engine input).

Done is not "agent trades for me." Done is "the two systems are talking and the dashboard makes the conversation visible." Agent layer comes after, in `ROADMAP.md`.

## Why this order

Tempting to skip to an agent layer. Don't. An agent needs structured context to be useful. Right now Signal Engine and Spread Sniper barely know about each other. An agent built today would either rubber-stamp Spread Sniper's existing decisions or override them with worse ones — paying LLM fees to second-guess your own scanner.

The integration phase makes the context queryable. After that, an agent has something useful to do (judgment over structured data, including disagreements between models). Skipping integration means the agent has nothing real to reason over.

## Phases

Each phase is small enough to finish in a session or two. Each has explicit acceptance criteria. Do them in order — later phases depend on earlier ones.

### Phase 1 — Signal Engine market-state API

**Goal**: One endpoint on Signal Engine that returns everything Spread Sniper or the dashboard might want, in structured JSON.

**Where the work happens**: `/Users/zona/PycharmProjects/signal-engine`

**What to build**:
- A new HTTP endpoint (Flask or FastAPI — pick whichever fits the existing code) at `/api/v1/market-state`
- Returns: current regime + probs, latest VIX, IV-RV spread, last N news scores (aggregated to a daily sentiment summary), latest FOMC stance, current open decay alerts, latest prediction, and a "stale-by" field indicating data freshness.
- Versioned URL (`/v1/`) so we can evolve without breaking consumers.
- Runs locally on a fixed port (e.g., 8765). Documented in Signal Engine's README.
- Read-only. No writes, no triggers, no LLM calls — pure query over `signal_engine.*`.

**Acceptance criteria**:
- Endpoint returns 200 with the structured payload in <100ms warm.
- One known-good integration test that hits the endpoint and validates the response schema against a pydantic/zod model.
- Stale-by field correctly reflects when the daily scheduler last updated each underlying table.
- Documented in Signal Engine `README.md` and `STATUS.md`.

**Out of scope**: Spread Sniper consumption (that's Phase 2). Dashboard changes (that's Phase 4).

---

### Phase 2 — Spread Sniper consumer

**Goal**: Spread Sniper reads Signal Engine's market-state and uses it as inputs without breaking existing behavior.

**Where the work happens**: `/Users/zona/spread-sniper`

**What to build**:
- A `data/collectors/signal_engine_client.py` that fetches from Phase 1's endpoint. Standard collector pattern matching `alpaca_client.py` etc.
- New feature columns in Spread Sniper's feature pipeline:
  - `se_regime_label`, `se_regime_probs_*`
  - `se_iv_rv_spread`
  - `se_news_sentiment_daily`
  - `se_fomc_hawkish_score`
  - `se_decay_alerts_active` (boolean)
  - `se_regime_disagrees` (boolean: True when Signal Engine HMM and Spread Sniper's own regime classifier label differently)
- Feature flag: `USE_SIGNAL_ENGINE_FEATURES` in `config/settings.py`. Default off until verified.
- Graceful degradation: if Signal Engine endpoint is down or stale, scanner runs without those features and logs the absence.

**Acceptance criteria**:
- Spread Sniper's daily scanner runs cleanly with the feature flag both on and off.
- New tests verify the client handles success, timeout, 5xx, and stale-data cases.
- The `se_regime_disagrees` flag fires on at least one historical date where it should (sanity check).
- No Signal Engine feature is passed into the SpreadScorer or strategy gates yet. Phase 2 is *fetching* only. Using them comes in Phase 3.

**Out of scope**: Letting Signal Engine features influence trade decisions (Phase 3). UI (Phase 4).

---

### Phase 3 — Decision-level integration (gated)

**Goal**: Signal Engine features influence Spread Sniper's behavior in defined, reversible ways.

**Where the work happens**: `/Users/zona/spread-sniper`

**This phase requires its own protocol doc before any feature touches a trade decision.** Same discipline as Signal Engine: pre-register, no knob-turning, narrow framing.

**What to build (after protocol is written and committed)**:
- Specific integration points to consider (pick a minimal set, don't kitchen-sink):
  - When Signal Engine HMM says `crisis` and Spread Sniper's regime says `calm_bull`, log a `WARN` alert and require manual confirmation for any new trade entry.
  - When `se_decay_alerts_active` is True for the regime model, downsize new positions by 50%.
  - When `se_iv_rv_spread` and Spread Sniper's own IV-RV calculation diverge by more than X std dev, log a `WARN` (don't auto-act — surface the disagreement).
  - When `se_fomc_hawkish_score` is in the extreme tails (|score| > 0.6) and FOMC is within 24h, no new premium-selling entries.
- Each rule lives behind its own config flag so individual rules can be turned off without reverting the integration.
- Backtest the rules against historical data via Spread Sniper's existing backtest engine. Pre-register expectations before running.

**Acceptance criteria**:
- Protocol doc in `spread-sniper/docs/SIGNAL_ENGINE_INTEGRATION_PROTOCOL.md` committed *before* any decision rule is enabled.
- Each decision rule has tests for both fire and not-fire cases.
- Backtest results reported honestly. If the integration doesn't help or hurts, that's the result.
- No rule is enabled in live trading until paper-trading results are reviewed.

**Out of scope**: New strategies. New trading logic beyond the specific gates listed.

---

### Phase 4 — Dashboard unification

**Goal**: One pane of glass shows Signal Engine context + Spread Sniper trading state + their interactions.

**Where the work happens**: `/Users/zona/Documents/spread-sniper-ui` (this repo)

**What to build**:
- A new "Unified" or "Today" view that shows:
  - Signal Engine context (regime, IV-RV, news, FOMC, decay alerts) — most of this already exists on the Signal Engine page.
  - Spread Sniper trading state (open positions, today's scanner candidates, risk state).
  - Disagreement panel: where do the two systems' regime labels diverge? Where do IV-RV calculations differ?
  - Active rule indicators: which Phase 3 rules are currently firing.
- New API endpoint on the Express server that aggregates from both schemas (`public` for Spread Sniper, `signal_engine` for Signal Engine) plus Phase 1's market-state endpoint.
- Reuses existing components and styling. No redesign of working pages.

**Acceptance criteria**:
- The Unified view loads in <300ms warm.
- Disagreement panel shows at least one real disagreement from historical data on first load (otherwise it's an empty box and looks broken).
- Active rule indicators correctly reflect Phase 3 config state.
- The existing Signal Engine and Spread Sniper pages still work; the Unified view supplements rather than replaces.

**Out of scope**: Mobile views. User-configurable layouts. Anything cosmetic beyond what's already in the dashboard's style.

---

## Things explicitly NOT in this plan

- **Agent layer.** Belongs in `ROADMAP.md`. Don't build until integration is done and the structured context surface is stable.
- **New Signal Engine hypotheses.** Research phase is closed. Reopening requires the criteria in Signal Engine's HANDOFF.
- **New Spread Sniper strategies.** Spread Sniper's strategy framework is its own roadmap. Integration adds *inputs*, not strategies.
- **Intraday data.** Out of scope until budget and a specific thesis justify it.
- **Order flow data.** Same.

## Discipline reminders

- Verify load-bearing numbers against ground truth. Don't accept summaries.
- Pre-register Phase 3 protocols before backtesting.
- Combined gate (DSR ≥ 0.95 AND PBO ≤ 0.25) for any signal claimed as tradeable.
- Narrow the claim. "Phase 3 rule N improved Spread Sniper's Sharpe in this sample" is fine. "Signal Engine context is the missing piece" is overreach.
- Honest nulls beat fake wins.
