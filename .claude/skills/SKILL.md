---
name: spread-sniper-signal-engine-integration
description: Use this skill whenever the user is working across the three repos (spread-sniper-ui, spread-sniper, signal-engine) to integrate Signal Engine context into Spread Sniper or surface the unified state in the dashboard. Triggers on any work involving the market-state API, cross-repo features, regime disagreement tracking, decay-alert wiring, or the Phase 1-4 integration plan. Encodes the honesty discipline carried over from the Signal Engine project (pre-registration, combined gate, verify-against-ground-truth, narrow framing).
---

# Spread Sniper × Signal Engine Integration

## Read these first, every session

1. `CONTEXT.md` — what the three repos are, where they live, what they do
2. `INTEGRATION_PLAN.md` — the active phased work
3. `ROADMAP.md` — what's after integration, what's deliberately not being built
4. The relevant repo's status file:
   - Signal Engine: `/Users/zona/PycharmProjects/signal-engine/STATUS.md` and `HANDOFF.md`
   - Spread Sniper: `/Users/zona/spread-sniper/README.md`
   - UI: source files (no docs yet)

Don't skip the orientation step. The integration work depends on understanding both systems' independent state.

## The three repos and where they live

| Repo | Path | Role |
|---|---|---|
| spread-sniper-ui | `/Users/zona/Documents/spread-sniper-ui` | Dashboard. React + Vite + Express. Not git-tracked. |
| spread-sniper | `/Users/zona/spread-sniper` | Live trading system. Python. Source of execution. |
| signal-engine | `/Users/zona/PycharmProjects/signal-engine` | Research instrument. Python. Source of context. |

They share one TimescaleDB container (`sniper-db`, port 5432). Spread Sniper uses the `public` schema; Signal Engine uses the `signal_engine` schema.

## What the integration is

Signal Engine becomes Spread Sniper's context provider. Spread Sniper consumes Signal Engine's regime label, IV-RV spread, news sentiment, FOMC stance, and decay alerts as additional features. The dashboard surfaces both systems' state side-by-side, including disagreements.

This is *not* an agent. This is *not* a strategy. This is plumbing that makes future agent work possible.

## How to work on it

### Always know which phase you're in

`INTEGRATION_PLAN.md` defines four phases:
1. Signal Engine market-state API
2. Spread Sniper consumer (fetch only, no decisions)
3. Decision-level integration (gated by protocol doc)
4. Dashboard unification

Phases are ordered for a reason. Phase 3 requires Phase 2. Phase 4 requires Phase 1.

When the user asks for something, identify which phase it belongs to. If the request crosses phases, separate them and do the earlier phase first.

### Each phase has acceptance criteria

They're explicit in `INTEGRATION_PLAN.md`. Don't claim a phase is done until the criteria are met. If you think a criterion is wrong or overspecified, push back and propose changes — don't silently skip it.

### Discipline carried from Signal Engine

Signal Engine caught 10+ load-bearing bugs by refusing to trust summaries on numbers that drive decisions. The bugs included:
- A Deflated Sharpe Ratio that always returned ~1.0 (silently passed every strategy)
- A CPCV runner that fabricated 31% returns at fold boundaries
- A timezone bug that shifted every price row by one day
- A PBO formula that computed an unrelated statistic

Every one was invisible in agent summaries. Every one surfaced when someone hand-verified a specific number against ground truth. Apply that discipline here.

**Verify load-bearing numbers.** When a calculation drives a decision (regime label, IV-RV value, position size), hand-check at least one value against an independent computation before trusting downstream results. Print the raw inputs and intermediate values, don't summarize.

**Pre-register before backtesting.** Phase 3 introduces decision rules. Each rule needs a protocol doc committed *before* the rule's backtest runs. No post-hoc threshold tuning. No "let's try with a different window." The trial-counting policy in `signal-engine/docs/DSR_TRIAL_COUNTING_POLICY.md` is the model.

**Combined gate for tradeable claims.** DSR ≥ 0.95 AND PBO ≤ 0.25 for any signal claimed as edge. DSR alone is fooled by autocorrelated observations.

**Narrow framing.** "This rule reduced drawdown by 23% in 2018-2023 on Spread Sniper's monthly_spreads strategy" is fine. "Signal Engine integration improves Spread Sniper" is overreach.

**Honest nulls.** If a Phase 3 rule doesn't help, report the null. Don't squeeze the numbers.

### Cross-repo work

Most integration tasks touch two or three repos. Be explicit about which files in which repo change.

When a task spans repos:
1. Identify the dependency direction (e.g., Spread Sniper depends on Signal Engine's API; the dashboard depends on both).
2. Build the upstream side first.
3. Verify the upstream side independently before wiring the downstream.
4. Add tests at both layers.

### The shared database is shared

When in doubt about a write to the database, default to read-only. Spread Sniper's `public` schema has a live trading system reading from it. Signal Engine's `signal_engine` schema has a daily scheduler writing to it. Don't add migrations or schema changes casually.

If a phase needs new tables, propose them and get confirmation before running migrations. Always namespace clearly — new integration tables should be obvious (e.g., `signal_engine.spread_sniper_integration_events`).

### Daily scheduler is running

Signal Engine has a launchd job running 3x/day. It writes to `signal_engine.prices`, `macro`, `regimes`, `news_scores`, `predictions`. Don't break the scheduler. If you change ingestion code, test against the scheduler's invocation path, not just manual runs.

### Tests are not optional

Both Signal Engine (~434 tests) and Spread Sniper (~549 tests) have heavy test coverage. New code in either repo follows the existing testing patterns. Integration code in the UI repo gets at least integration tests against mocked APIs.

For load-bearing math (any new computation that drives a decision), known-answer tests are required. Construct an input where the correct output is known by independent calculation; assert against that exact value.

### When the user asks for a summary, give raw evidence too

The pattern that catches bugs is showing the raw numbers and computations, not a tidy table. When reporting results, include:
- The input values that produced the result
- The intermediate computation
- The final number
- One hand-checked example

If the user pushes back on a result and asks for arithmetic, *show the arithmetic*. Don't recompute and re-summarize — show the actual numbers being multiplied and added.

## Common task patterns

### "Add a new feature to Spread Sniper that uses Signal Engine data"

1. Confirm Phase 1 is done (the market-state API exists). If not, do Phase 1 first.
2. Add the field to the API response if it's missing.
3. Add it to the Spread Sniper client in `data/collectors/signal_engine_client.py`.
4. Add it to Spread Sniper's feature pipeline.
5. Add tests at both the API layer and the consumer layer.
6. *Don't* let the new feature influence trading decisions without a Phase 3 protocol doc.

### "Surface X in the dashboard"

1. Confirm the data exists in one of the schemas, or in the market-state API.
2. Add a new endpoint to the Express server (`/server/index.js`) that returns the data. Use the existing pattern. Run queries in parallel via `Promise.all`.
3. Add a hook in `src/hooks/useSignalEngine.ts` or a new file if it's a new domain.
4. Add a memoized React component. Match existing styling. No new dependencies.
5. Log query timings the first time. If any query is over 100ms, add an index.

### "Make Signal Engine and Spread Sniper agree about X"

1. Don't force them to agree. The disagreement is often the signal.
2. Compute both values, store both, surface both, and add a `disagreement` flag.
3. Only after surfacing disagreement and observing it for a while should you propose reconciliation logic.

### "Build the agent layer"

1. Check `ROADMAP.md`. The agent layer is "Next" not "Now."
2. Confirm Phase 1-4 of integration is complete and stable for 2+ weeks.
3. If not, push back. Building the agent on top of incomplete integration is the failure mode `INTEGRATION_PLAN.md` warns about.
4. If the user insists, document the risk and proceed with the smallest possible recommend-only version. No auto-execution.

## Things to never do

- Silently change the combined gate (DSR ≥ 0.95 AND PBO ≤ 0.25). It's load-bearing.
- Bypass pre-registration to chase a result.
- Modify Spread Sniper's risk controls (correlation limits, kill switch, position sizing) as part of integration work. Those are separate concerns.
- Run migrations against the shared database without confirmation.
- Add a new direct dependency between repos that bypasses the market-state API. The API is the seam; keep it.
- Claim a strategy "works" based on a single positive number without hand-verification.
- Re-test a closed Signal Engine hypothesis with different parameters. The verdicts are locked.

## When you're not sure

Stop and ask. The cost of asking is small. The cost of building the wrong thing across three repos is large. The cost of writing a test that validates a bug is the worst of all.
