import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createReadStream, existsSync, statSync } from 'fs';
import { parse } from 'csv-parse';
import { computeIvRvSpread } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
config({ path: resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Database connection pool
const pool = new pg.Pool({
  host: process.env.TIMESCALE_HOST || 'localhost',
  port: parseInt(process.env.TIMESCALE_PORT || '5432'),
  database: process.env.TIMESCALE_DB || 'spread_sniper',
  user: process.env.TIMESCALE_USER || 'sniper',
  password: process.env.TIMESCALE_PASSWORD,
});

// Log paths
const SCAN_HISTORY_PATH = process.env.SCAN_HISTORY_PATH || '/Users/zona/spread-sniper/logs/scan_history.csv';
const AUTOMATION_LOGS_PATH = process.env.AUTOMATION_LOGS_PATH || '/Users/zona/spread-sniper/logs/automation';

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', timestamp: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Overview endpoint - Current system status
app.get('/api/overview', async (req, res) => {
  try {
    // Get latest regime from regime_history
    const regimeResult = await pool.query(`
      SELECT regime, probability, timestamp
      FROM regime_history
      ORDER BY timestamp DESC
      LIMIT 1
    `).catch(() => ({ rows: [] }));

    // Get latest market data (VIX)
    const vixResult = await pool.query(`
      SELECT vix, close, timestamp
      FROM market_data
      WHERE symbol = 'SPY'
      ORDER BY timestamp DESC
      LIMIT 1
    `).catch(() => ({ rows: [] }));

    // Get IV-RV spread from features
    const featuresResult = await pool.query(`
      SELECT iv_rv_spread, timestamp
      FROM features
      WHERE symbol = 'SPY'
      ORDER BY timestamp DESC
      LIMIT 1
    `).catch(() => ({ rows: [] }));

    // Get open positions count from trades
    const openPositionsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM trades
      WHERE status = 'open'
    `).catch(() => ({ rows: [{ count: 0 }] }));

    // Get today's P&L from trades
    const todayPnLResult = await pool.query(`
      SELECT COALESCE(SUM(pnl), 0) as total_pnl
      FROM trades
      WHERE DATE(close_time) = CURRENT_DATE
        AND status = 'closed'
    `).catch(() => ({ rows: [{ total_pnl: 0 }] }));

    // Get account value (simulated $5k + cumulative P&L)
    const totalPnLResult = await pool.query(`
      SELECT COALESCE(SUM(pnl), 0) as total_pnl
      FROM trades
      WHERE status = 'closed'
    `).catch(() => ({ rows: [{ total_pnl: 0 }] }));

    // Read latest scan from CSV
    let lastScan = null;
    if (existsSync(SCAN_HISTORY_PATH)) {
      const scans = await readScanHistory(5);
      lastScan = scans[0] || null;
    }

    const regime = regimeResult.rows[0];
    const vix = vixResult.rows[0];
    const features = featuresResult.rows[0];
    const baseCash = 5000;
    const totalPnL = parseFloat(totalPnLResult.rows[0]?.total_pnl || 0);

    res.json({
      accountValue: baseCash + totalPnL,
      todayPnL: parseFloat(todayPnLResult.rows[0]?.total_pnl || 0),
      regime: regime?.regime || 'unknown',
      regimeConfidence: regime?.probability || 0,
      vix: vix?.vix || lastScan?.vix || 0,
      ivRvSpread: features?.iv_rv_spread || lastScan?.iv_rv_spread || 0,
      shouldTrade: lastScan ? lastScan.setups_found > 0 : false,
      openPositions: parseInt(openPositionsResult.rows[0]?.count || 0),
      lastScanTimestamp: lastScan?.timestamp || regime?.timestamp || null,
      spyPrice: vix?.close || lastScan?.spy_price || 0,
    });
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Performance endpoint - Trading metrics
app.get('/api/performance', async (req, res) => {
  try {
    // Equity curve - cumulative P&L over time
    const equityCurveResult = await pool.query(`
      SELECT
        DATE(close_time) as date,
        SUM(pnl) OVER (ORDER BY DATE(close_time)) as cumulative_pnl
      FROM trades
      WHERE status = 'closed' AND close_time IS NOT NULL
      ORDER BY date
    `).catch(() => ({ rows: [] }));

    // Win rate
    const winRateResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE pnl > 0) as wins,
        COUNT(*) FILTER (WHERE pnl <= 0) as losses,
        COUNT(*) as total
      FROM trades
      WHERE status = 'closed'
    `).catch(() => ({ rows: [{ wins: 0, losses: 0, total: 0 }] }));

    // P&L by strategy
    const strategyPnLResult = await pool.query(`
      SELECT
        strategy,
        SUM(pnl) as total_pnl,
        COUNT(*) as trade_count
      FROM trades
      WHERE status = 'closed'
      GROUP BY strategy
    `).catch(() => ({ rows: [] }));

    // P&L by regime
    const regimePnLResult = await pool.query(`
      SELECT
        regime,
        SUM(pnl) as total_pnl,
        COUNT(*) as trade_count
      FROM trades
      WHERE status = 'closed'
      GROUP BY regime
    `).catch(() => ({ rows: [] }));

    // Monthly returns
    const monthlyReturnsResult = await pool.query(`
      SELECT
        DATE_TRUNC('month', close_time) as month,
        SUM(pnl) as total_pnl
      FROM trades
      WHERE status = 'closed' AND close_time IS NOT NULL
      GROUP BY DATE_TRUNC('month', close_time)
      ORDER BY month
    `).catch(() => ({ rows: [] }));

    // Drawdown calculation
    const drawdownResult = await pool.query(`
      WITH cumulative AS (
        SELECT
          DATE(close_time) as date,
          SUM(pnl) OVER (ORDER BY DATE(close_time)) as cumulative_pnl
        FROM trades
        WHERE status = 'closed' AND close_time IS NOT NULL
      ),
      peaks AS (
        SELECT
          date,
          cumulative_pnl,
          MAX(cumulative_pnl) OVER (ORDER BY date) as peak
        FROM cumulative
      )
      SELECT
        date,
        cumulative_pnl,
        peak,
        (cumulative_pnl - peak) as drawdown
      FROM peaks
      ORDER BY date
    `).catch(() => ({ rows: [] }));

    const winRate = winRateResult.rows[0];
    const wins = parseInt(winRate?.wins || 0);
    const total = parseInt(winRate?.total || 0);

    res.json({
      equityCurve: equityCurveResult.rows.map(r => ({
        date: r.date,
        value: 5000 + parseFloat(r.cumulative_pnl || 0)
      })),
      drawdown: drawdownResult.rows.map(r => ({
        date: r.date,
        drawdown: parseFloat(r.drawdown || 0),
        equity: 5000 + parseFloat(r.cumulative_pnl || 0)
      })),
      winRate: {
        wins,
        losses: parseInt(winRate?.losses || 0),
        total,
        percentage: total > 0 ? (wins / total) * 100 : 0
      },
      strategyPnL: strategyPnLResult.rows.map(r => ({
        strategy: r.strategy || 'Unknown',
        pnl: parseFloat(r.total_pnl || 0),
        tradeCount: parseInt(r.trade_count || 0)
      })),
      regimePnL: regimePnLResult.rows.map(r => ({
        regime: r.regime || 'Unknown',
        pnl: parseFloat(r.total_pnl || 0),
        tradeCount: parseInt(r.trade_count || 0)
      })),
      monthlyReturns: monthlyReturnsResult.rows.map(r => ({
        month: r.month,
        pnl: parseFloat(r.total_pnl || 0)
      }))
    });
  } catch (error) {
    console.error('Performance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scanner endpoint - Recent scans and candidates
app.get('/api/scanner', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    // Read scan history from CSV
    const scans = await readScanHistory(limit);

    // Get current options chain candidates
    const candidatesResult = await pool.query(`
      SELECT
        symbol,
        expiration,
        strike,
        option_type,
        bid,
        ask,
        implied_volatility,
        delta,
        gamma,
        theta,
        vega,
        open_interest,
        volume,
        timestamp
      FROM options_chains
      WHERE timestamp > NOW() - INTERVAL '1 day'
      ORDER BY timestamp DESC, implied_volatility DESC
      LIMIT 20
    `).catch(() => ({ rows: [] }));

    res.json({
      scans,
      candidates: candidatesResult.rows.map(r => ({
        symbol: r.symbol,
        expiration: r.expiration,
        strike: parseFloat(r.strike || 0),
        optionType: r.option_type,
        bid: parseFloat(r.bid || 0),
        ask: parseFloat(r.ask || 0),
        iv: parseFloat(r.implied_volatility || 0),
        delta: parseFloat(r.delta || 0),
        gamma: parseFloat(r.gamma || 0),
        theta: parseFloat(r.theta || 0),
        vega: parseFloat(r.vega || 0),
        openInterest: parseInt(r.open_interest || 0),
        volume: parseInt(r.volume || 0),
        timestamp: r.timestamp
      }))
    });
  } catch (error) {
    console.error('Scanner error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trades endpoint - Trade journal
app.get('/api/trades', async (req, res) => {
  try {
    const { strategy, status, startDate, endDate, limit = 100, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (strategy) {
      whereClause += ` AND strategy = $${paramIndex++}`;
      params.push(strategy);
    }
    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (startDate) {
      whereClause += ` AND entry_time >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND entry_time <= $${paramIndex++}`;
      params.push(endDate);
    }

    const tradesResult = await pool.query(`
      SELECT
        id,
        symbol,
        strategy,
        regime,
        entry_time,
        exit_time,
        close_time,
        entry_price,
        exit_price,
        quantity,
        pnl,
        status,
        notes
      FROM trades
      ${whereClause}
      ORDER BY entry_time DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, parseInt(limit), parseInt(offset)]).catch(() => ({ rows: [] }));

    // Get distinct strategies and statuses for filters
    const strategiesResult = await pool.query(`
      SELECT DISTINCT strategy FROM trades WHERE strategy IS NOT NULL
    `).catch(() => ({ rows: [] }));

    const statusesResult = await pool.query(`
      SELECT DISTINCT status FROM trades WHERE status IS NOT NULL
    `).catch(() => ({ rows: [] }));

    // Total count for pagination
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM trades ${whereClause}
    `, params).catch(() => ({ rows: [{ total: 0 }] }));

    res.json({
      trades: tradesResult.rows.map(r => ({
        id: r.id,
        symbol: r.symbol,
        strategy: r.strategy,
        regime: r.regime,
        entryTime: r.entry_time,
        exitTime: r.exit_time || r.close_time,
        entryPrice: parseFloat(r.entry_price || 0),
        exitPrice: parseFloat(r.exit_price || 0),
        quantity: parseInt(r.quantity || 0),
        pnl: parseFloat(r.pnl || 0),
        status: r.status,
        notes: r.notes
      })),
      filters: {
        strategies: strategiesResult.rows.map(r => r.strategy),
        statuses: statusesResult.rows.map(r => r.status)
      },
      pagination: {
        total: parseInt(countResult.rows[0]?.total || 0),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Trades error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Risk endpoint - Risk metrics
app.get('/api/risk', async (req, res) => {
  try {
    const baseCash = 5000;
    const maxRiskPercent = 20;

    // Current exposure from open positions
    const exposureResult = await pool.query(`
      SELECT
        COALESCE(SUM(ABS(entry_price * quantity)), 0) as total_exposure,
        COUNT(*) as open_count
      FROM trades
      WHERE status = 'open'
    `).catch(() => ({ rows: [{ total_exposure: 0, open_count: 0 }] }));

    // Weekly drawdown
    const weeklyDrawdownResult = await pool.query(`
      SELECT COALESCE(SUM(pnl), 0) as weekly_pnl
      FROM trades
      WHERE status = 'closed'
        AND close_time >= DATE_TRUNC('week', CURRENT_DATE)
    `).catch(() => ({ rows: [{ weekly_pnl: 0 }] }));

    // Monthly drawdown
    const monthlyDrawdownResult = await pool.query(`
      SELECT COALESCE(SUM(pnl), 0) as monthly_pnl
      FROM trades
      WHERE status = 'closed'
        AND close_time >= DATE_TRUNC('month', CURRENT_DATE)
    `).catch(() => ({ rows: [{ monthly_pnl: 0 }] }));

    // Count of correlated index positions (SPY, QQQ, IWM)
    const indexPositionsResult = await pool.query(`
      SELECT COUNT(DISTINCT symbol) as index_count
      FROM trades
      WHERE status = 'open'
        AND symbol IN ('SPY', 'QQQ', 'IWM')
    `).catch(() => ({ rows: [{ index_count: 0 }] }));

    // Total realized P&L for account value
    const totalPnLResult = await pool.query(`
      SELECT COALESCE(SUM(pnl), 0) as total_pnl
      FROM trades
      WHERE status = 'closed'
    `).catch(() => ({ rows: [{ total_pnl: 0 }] }));

    const totalPnL = parseFloat(totalPnLResult.rows[0]?.total_pnl || 0);
    const accountValue = baseCash + totalPnL;
    const exposure = parseFloat(exposureResult.rows[0]?.total_exposure || 0);
    const exposurePercent = accountValue > 0 ? (exposure / accountValue) * 100 : 0;
    const settledCash = accountValue - exposure;

    const weeklyPnL = parseFloat(weeklyDrawdownResult.rows[0]?.weekly_pnl || 0);
    const monthlyPnL = parseFloat(monthlyDrawdownResult.rows[0]?.monthly_pnl || 0);

    // Circuit breaker: triggered if drawdown exceeds 5% weekly or 10% monthly
    const weeklyDrawdownPercent = accountValue > 0 ? (weeklyPnL / baseCash) * 100 : 0;
    const monthlyDrawdownPercent = accountValue > 0 ? (monthlyPnL / baseCash) * 100 : 0;
    const circuitBreakerActive = weeklyDrawdownPercent < -5 || monthlyDrawdownPercent < -10;

    // Backwardation kill switch - would need VIX futures data, use placeholder
    const backwardationActive = false;

    res.json({
      exposure: {
        current: exposure,
        percent: exposurePercent,
        maxPercent: maxRiskPercent
      },
      settledCash,
      accountValue,
      drawdown: {
        weekly: {
          amount: weeklyPnL,
          percent: weeklyDrawdownPercent
        },
        monthly: {
          amount: monthlyPnL,
          percent: monthlyDrawdownPercent
        }
      },
      circuitBreakerActive,
      backwardationActive,
      correlatedIndexPositions: {
        count: parseInt(indexPositionsResult.rows[0]?.index_count || 0),
        max: 3
      }
    });
  } catch (error) {
    console.error('Risk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Regime History endpoint
app.get('/api/regime-history', async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const historyResult = await pool.query(`
      SELECT
        regime,
        probability,
        timestamp
      FROM regime_history
      WHERE timestamp >= NOW() - INTERVAL '${parseInt(days)} days'
      ORDER BY timestamp ASC
    `).catch(() => ({ rows: [] }));

    res.json({
      history: historyResult.rows.map(r => ({
        regime: r.regime,
        probability: parseFloat(r.probability || 0),
        timestamp: r.timestamp
      }))
    });
  } catch (error) {
    console.error('Regime history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to read scan history CSV
async function readScanHistory(limit = 50) {
  return new Promise((resolve, reject) => {
    if (!existsSync(SCAN_HISTORY_PATH)) {
      return resolve([]);
    }

    const records = [];
    const parser = createReadStream(SCAN_HISTORY_PATH).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      })
    );

    parser.on('data', (record) => {
      records.push({
        timestamp: record.timestamp,
        regime: record.regime,
        regimeConfidence: parseFloat(record.regime_confidence || 0),
        iv_rv_spread: parseFloat(record.iv_rv_spread || 0),
        iv_rv_threshold: parseFloat(record.iv_rv_threshold || 0),
        vix: parseFloat(record.vix || 0),
        iv_rank: parseFloat(record.iv_rank || 0),
        spy_price: parseFloat(record.spy_price || 0),
        setups_found: parseInt(record.setups_found || 0),
        trades_executed: parseInt(record.trades_executed || 0)
      });
    });

    parser.on('end', () => {
      // Return most recent first, limited
      resolve(records.reverse().slice(0, limit));
    });

    parser.on('error', (error) => {
      console.error('CSV parse error:', error);
      resolve([]);
    });
  });
}

// =============================================================================
// SIGNAL ENGINE ENDPOINTS (signal_engine schema)
// =============================================================================

// Signal Engine: Snapshot (all data in one request, parallel queries)
app.get('/api/signal-engine/snapshot', async (req, res) => {
  const startTime = Date.now();
  const timings = {};

  try {
    // Define all queries
    const queries = {
      regime: pool.query(`
        SELECT ts, regime_label, regime_probs
        FROM signal_engine.regimes
        ORDER BY ts DESC
        LIMIT 1
      `),
      vixHistory: pool.query(`
        SELECT ts, value
        FROM signal_engine.macro
        WHERE series_id = 'VIXCLS'
        ORDER BY ts DESC
        LIMIT 90
      `),
      spyHistory: pool.query(`
        SELECT ts, close
        FROM signal_engine.prices
        WHERE symbol = 'SPY'
        ORDER BY ts DESC
        LIMIT 112
      `),
      news: pool.query(`
        SELECT
          ns.scored_at,
          n.headline,
          ns.directional_sentiment,
          ns.magnitude
        FROM signal_engine.news_scores ns
        JOIN signal_engine.news n ON ns.news_id = n.id
        ORDER BY ns.scored_at DESC
        LIMIT 10
      `),
      fomc: pool.query(`
        SELECT event_date, event_type, hawkish_score, reasoning
        FROM signal_engine.fomc_events
        ORDER BY event_date DESC
        LIMIT 1
      `),
      regimeHistory: pool.query(`
        SELECT ts, regime_label
        FROM signal_engine.regimes
        WHERE ts >= NOW() - INTERVAL '90 days'
        ORDER BY ts ASC
      `),
      latestPrediction: pool.query(`
        SELECT id, made_at, horizon, predicted_direction, predicted_prob, source, regime_at_pred
        FROM signal_engine.predictions
        ORDER BY made_at DESC
        LIMIT 1
      `),
      predictionAccuracy: pool.query(`
        SELECT
          p.id,
          p.made_at,
          p.predicted_direction,
          p.predicted_prob,
          r.return_1d,
          CASE
            WHEN p.predicted_direction = 'bull' AND r.return_1d > 0 THEN true
            WHEN p.predicted_direction = 'bear' AND r.return_1d < 0 THEN true
            ELSE false
          END AS correct
        FROM signal_engine.predictions p
        JOIN signal_engine.realized r ON p.id = r.prediction_id
        WHERE r.return_1d IS NOT NULL
        ORDER BY p.made_at DESC
        LIMIT 60
      `),
      decayAlerts: pool.query(`
        SELECT
          id, created_at, source, alert_level, alert_message,
          current_sharpe, historical_sharpe, sharpe_zscore,
          recent_accuracy, historical_accuracy, accuracy_decline,
          cusum_breaches
        FROM signal_engine.decay_alerts
        WHERE resolved_at IS NULL
        ORDER BY
          CASE alert_level WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
          created_at DESC
        LIMIT 10
      `),
    };

    // Time each query individually for diagnostics
    const queryNames = Object.keys(queries);
    const queryPromises = queryNames.map(async (name) => {
      const qStart = Date.now();
      const result = await queries[name];
      timings[name] = Date.now() - qStart;
      return { name, result };
    });

    const results = await Promise.all(queryPromises);
    const resultMap = Object.fromEntries(results.map(r => [r.name, r.result]));

    // Log timings on first request or if any query is slow (>100ms)
    const slowQueries = Object.entries(timings).filter(([, ms]) => ms > 100);
    if (slowQueries.length > 0 || !global._snapshotTimingsLogged) {
      console.log('Signal Engine snapshot query timings:', timings);
      global._snapshotTimingsLogged = true;
    }

    // Process regime
    const regimeRow = resultMap.regime.rows[0];
    const regime = regimeRow ? {
      label: regimeRow.regime_label,
      probs: regimeRow.regime_probs,
      timestamp: regimeRow.ts,
    } : null;

    // Process VIX history
    const vixRows = resultMap.vixHistory.rows.reverse();
    const vixCurrent = vixRows.length > 0 ? parseFloat(vixRows[vixRows.length - 1].value) : null;

    // Process SPY history and compute RV
    const spyRows = resultMap.spyHistory.rows.reverse();
    const spyCurrent = spyRows.length > 0 ? parseFloat(spyRows[spyRows.length - 1].close) : null;

    // Compute current RV and IV-RV spread from last 22 prices
    const prices = spyRows.slice(-22).map(r => parseFloat(r.close));
    const { rv, ivRvSpread } = computeIvRvSpread(vixCurrent, prices);

    // Compute IV-RV spread history (align VIX and SPY by date)
    const ivRvHistory = [];
    const spyByDate = new Map(spyRows.map(r => [r.ts.toISOString().split('T')[0], parseFloat(r.close)]));
    const spyDates = Array.from(spyByDate.keys());

    for (let i = 0; i < vixRows.length; i++) {
      const vixDate = vixRows[i].ts.toISOString().split('T')[0];
      const vixVal = parseFloat(vixRows[i].value);

      // Find 21 prior SPY prices for RV calc
      const dateIdx = spyDates.indexOf(vixDate);
      if (dateIdx >= 21) {
        const priorPrices = spyDates.slice(dateIdx - 21, dateIdx + 1).map(d => spyByDate.get(d));
        if (priorPrices.length === 22 && priorPrices.every(p => p !== undefined)) {
          const returns = [];
          for (let j = 1; j < priorPrices.length; j++) {
            returns.push(Math.log(priorPrices[j] / priorPrices[j - 1]));
          }
          const m = returns.reduce((a, b) => a + b, 0) / returns.length;
          const v = returns.reduce((sum, r) => sum + Math.pow(r - m, 2), 0) / returns.length;
          const rvPoint = Math.sqrt(v) * Math.sqrt(252) * 100;
          ivRvHistory.push({
            ts: vixRows[i].ts,
            value: parseFloat((vixVal - rvPoint).toFixed(2)),
          });
        }
      }
    }

    // Process news
    const news = resultMap.news.rows.map(r => ({
      headline: r.headline,
      scoredAt: r.scored_at,
      sentiment: parseFloat(r.directional_sentiment),
      magnitude: r.magnitude,
    }));

    // Process FOMC
    const fomcRow = resultMap.fomc.rows[0];
    const fomc = fomcRow ? {
      eventDate: fomcRow.event_date,
      eventType: fomcRow.event_type,
      hawkishScore: fomcRow.hawkish_score ? parseFloat(fomcRow.hawkish_score) : null,
    } : null;

    // Process regime history
    const regimeHistory = resultMap.regimeHistory.rows.map(r => ({
      ts: r.ts,
      label: r.regime_label,
    }));

    // Process latest prediction
    const predRow = resultMap.latestPrediction.rows[0];
    const latestPrediction = predRow ? {
      id: predRow.id,
      madeAt: predRow.made_at,
      horizon: predRow.horizon,
      predictedDirection: predRow.predicted_direction,
      predictedProb: parseFloat(predRow.predicted_prob),
      source: predRow.source,
      regimeAtPred: predRow.regime_at_pred,
    } : null;

    // Process prediction accuracy
    const accuracyRows = resultMap.predictionAccuracy.rows;
    const predictionAccuracy = {
      totalResolved: accuracyRows.length,
      predictions: accuracyRows.map(r => ({
        id: r.id,
        madeAt: r.made_at,
        predictedDirection: r.predicted_direction,
        correct: r.correct,
      })),
    };

    // Process decay alerts
    const decayAlerts = resultMap.decayAlerts.rows.map(r => ({
      id: r.id,
      createdAt: r.created_at,
      source: r.source,
      alertLevel: r.alert_level,
      alertMessage: r.alert_message,
      currentSharpe: r.current_sharpe ? parseFloat(r.current_sharpe) : null,
      historicalSharpe: r.historical_sharpe ? parseFloat(r.historical_sharpe) : null,
      sharpeZscore: r.sharpe_zscore ? parseFloat(r.sharpe_zscore) : null,
      recentAccuracy: r.recent_accuracy ? parseFloat(r.recent_accuracy) : null,
      historicalAccuracy: r.historical_accuracy ? parseFloat(r.historical_accuracy) : null,
      accuracyDecline: r.accuracy_decline ? parseFloat(r.accuracy_decline) : null,
      cusumBreaches: r.cusum_breaches,
    }));

    res.json({
      timestamp: new Date().toISOString(),
      regime,
      vol: {
        vix: vixCurrent,
        rv: rv !== null ? parseFloat(rv.toFixed(2)) : null,
        ivRvSpread: ivRvSpread !== null ? parseFloat(ivRvSpread.toFixed(2)) : null,
        vixHistory: vixRows.map(r => ({ ts: r.ts, value: parseFloat(r.value) })),
        ivRvHistory,
      },
      spy: {
        current: spyCurrent,
        history: spyRows.slice(-90).map(r => ({ ts: r.ts, close: parseFloat(r.close) })),
      },
      news,
      fomc,
      regimeHistory,
      latestPrediction,
      predictionAccuracy,
      decayAlerts,
      _timings: timings,
      _totalMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Signal Engine snapshot error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Signal Engine: Current Regime
app.get('/api/signal-engine/regime', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ts, regime_label, regime_probs
      FROM signal_engine.regimes
      ORDER BY ts DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json({ regime: null });
    }

    const row = result.rows[0];
    res.json({
      timestamp: row.ts,
      regimeLabel: row.regime_label,
      regimeProbs: row.regime_probs,
    });
  } catch (error) {
    console.error('Signal Engine regime error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Signal Engine: Volatility State (VIX + IV-RV spread)
app.get('/api/signal-engine/vol', async (req, res) => {
  try {
    // Get latest VIX
    const vixResult = await pool.query(`
      SELECT ts, value
      FROM signal_engine.macro
      WHERE series_id = 'VIXCLS'
      ORDER BY ts DESC
      LIMIT 1
    `);

    // Get last 22 SPY closes for 21-day rolling std calculation
    const pricesResult = await pool.query(`
      SELECT ts, close
      FROM signal_engine.prices
      WHERE symbol = 'SPY'
      ORDER BY ts DESC
      LIMIT 22
    `);

    if (vixResult.rows.length === 0 || pricesResult.rows.length < 2) {
      return res.json({ vix: null, rv: null, ivRvSpread: null });
    }

    const vix = parseFloat(vixResult.rows[0].value);
    const vixTimestamp = vixResult.rows[0].ts;

    // Calculate log returns and 21-day realized vol
    const prices = pricesResult.rows.map(r => parseFloat(r.close)).reverse();
    const logReturns = [];
    for (let i = 1; i < prices.length; i++) {
      logReturns.push(Math.log(prices[i] / prices[i - 1]));
    }

    // Standard deviation of log returns
    const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
    const variance = logReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / logReturns.length;
    const stdDev = Math.sqrt(variance);

    // Annualize: multiply by sqrt(252)
    const rv = stdDev * Math.sqrt(252) * 100; // Convert to percentage
    const ivRvSpread = vix - rv;

    res.json({
      vix,
      vixTimestamp,
      rv: parseFloat(rv.toFixed(2)),
      ivRvSpread: parseFloat(ivRvSpread.toFixed(2)),
      pricesTimestamp: pricesResult.rows[0].ts,
    });
  } catch (error) {
    console.error('Signal Engine vol error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Signal Engine: Recent News Scores
app.get('/api/signal-engine/news', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const result = await pool.query(`
      SELECT
        ns.scored_at,
        n.headline,
        ns.directional_sentiment,
        ns.magnitude
      FROM signal_engine.news_scores ns
      JOIN signal_engine.news n ON ns.news_id = n.id
      ORDER BY ns.scored_at DESC
      LIMIT $1
    `, [limit]);

    res.json({
      news: result.rows.map(r => ({
        scoredAt: r.scored_at,
        headline: r.headline,
        directionalSentiment: parseFloat(r.directional_sentiment),
        magnitude: r.magnitude,
      })),
    });
  } catch (error) {
    console.error('Signal Engine news error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Signal Engine: Most Recent FOMC
app.get('/api/signal-engine/fomc', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT event_date, event_type, hawkish_score, reasoning
      FROM signal_engine.fomc_events
      ORDER BY event_date DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json({ fomc: null });
    }

    const row = result.rows[0];
    res.json({
      eventDate: row.event_date,
      eventType: row.event_type,
      hawkishScore: row.hawkish_score ? parseFloat(row.hawkish_score) : null,
      reasoning: row.reasoning,
    });
  } catch (error) {
    console.error('Signal Engine FOMC error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Signal Engine: Regime History (last N days)
app.get('/api/signal-engine/regime-history', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;

    const result = await pool.query(`
      SELECT ts, regime_label, regime_probs
      FROM signal_engine.regimes
      WHERE ts >= NOW() - INTERVAL '${days} days'
      ORDER BY ts ASC
    `);

    res.json({
      history: result.rows.map(r => ({
        timestamp: r.ts,
        regimeLabel: r.regime_label,
        regimeProbs: r.regime_probs,
      })),
    });
  } catch (error) {
    console.error('Signal Engine regime history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// UNIFIED ENDPOINT (Phase 4: both systems side by side)
// =============================================================================

app.get('/api/unified/snapshot', async (req, res) => {
  const startTime = Date.now();
  const timings = {};

  try {
    // Define all queries - run in parallel
    const queryStart = Date.now();

    const queries = {
      // Signal Engine queries
      seRegime: pool.query(`
        SELECT ts, regime_label, regime_probs
        FROM signal_engine.regimes
        ORDER BY ts DESC
        LIMIT 1
      `),
      seFomc: pool.query(`
        SELECT event_date, event_type, hawkish_score
        FROM signal_engine.fomc_events
        ORDER BY event_date DESC
        LIMIT 1
      `),
      seNews: pool.query(`
        SELECT
          n.ts as published_at,
          n.headline,
          ns.directional_sentiment,
          ns.magnitude
        FROM signal_engine.news_scores ns
        JOIN signal_engine.news n ON ns.news_id = n.id
        ORDER BY n.ts DESC
        LIMIT 5
      `),
      seDecayAlerts: pool.query(`
        SELECT id, created_at, source, alert_level, alert_message
        FROM signal_engine.decay_alerts
        WHERE resolved_at IS NULL
          AND alert_level IN ('warning', 'critical')
        ORDER BY created_at DESC
        LIMIT 5
      `),
      sePrediction: pool.query(`
        SELECT id, made_at, horizon, predicted_direction, predicted_prob, source, regime_at_pred
        FROM signal_engine.predictions
        ORDER BY made_at DESC
        LIMIT 1
      `),
      seVix: pool.query(`
        SELECT ts, value
        FROM signal_engine.macro
        WHERE series_id = 'VIXCLS'
        ORDER BY ts DESC
        LIMIT 1
      `),
      seSpyPrices: pool.query(`
        SELECT ts, close
        FROM signal_engine.prices
        WHERE symbol = 'SPY'
        ORDER BY ts DESC
        LIMIT 22
      `),

      // Spread Sniper queries
      ssRegime: pool.query(`
        SELECT regime, probability, timestamp
        FROM regime_history
        ORDER BY timestamp DESC
        LIMIT 1
      `),
      ssFeatures: pool.query(`
        SELECT ts, iv_rv_spread, atm_iv, rv_21
        FROM features
        WHERE symbol = 'SPY' AND iv_rv_spread IS NOT NULL
        ORDER BY ts DESC
        LIMIT 1
      `),
      ssOpenPositions: pool.query(`
        SELECT COUNT(*) as count
        FROM trades
        WHERE status = 'open'
      `),
      ssExposure: pool.query(`
        SELECT
          COALESCE(SUM(ABS(entry_price * quantity)), 0) as total_exposure
        FROM trades
        WHERE status = 'open'
      `),
      ssWeeklyPnL: pool.query(`
        SELECT COALESCE(SUM(pnl), 0) as weekly_pnl
        FROM trades
        WHERE status = 'closed'
          AND close_time >= DATE_TRUNC('week', CURRENT_DATE)
      `),
      ssTotalPnL: pool.query(`
        SELECT COALESCE(SUM(pnl), 0) as total_pnl
        FROM trades
        WHERE status = 'closed'
      `),
    };

    // Time each query
    const queryNames = Object.keys(queries);
    const queryPromises = queryNames.map(async (name) => {
      const qStart = Date.now();
      try {
        const result = await queries[name];
        timings[name] = Date.now() - qStart;
        return { name, result, error: null };
      } catch (err) {
        timings[name] = Date.now() - qStart;
        return { name, result: { rows: [] }, error: err.message };
      }
    });

    const results = await Promise.all(queryPromises);
    const resultMap = Object.fromEntries(results.map(r => [r.name, r.result]));

    timings._queries = Date.now() - queryStart;

    // Process Signal Engine regime
    const seRegimeRow = resultMap.seRegime.rows[0];
    const seRegime = seRegimeRow ? {
      label: seRegimeRow.regime_label,
      probs: seRegimeRow.regime_probs,
      timestamp: seRegimeRow.ts,
      quarantined: true, // HMM is quarantined due to sticky-crisis bug
      quarantineReason: 'HMM transition matrix bug: P(crisis→low_vol)=0%. Do not use for trading decisions.',
    } : null;

    // Process SE VIX and compute SE IV-RV spread
    const seVixRow = resultMap.seVix.rows[0];
    const seVix = seVixRow ? parseFloat(seVixRow.value) : null;

    // Compute SE RV and IV-RV spread using shared util
    const spyRows = resultMap.seSpyPrices.rows;
    const sePrices = spyRows.map(r => parseFloat(r.close)).reverse();
    const { rv: seRv, ivRvSpread: seIvRvSpread } = computeIvRvSpread(seVix, sePrices);

    // Process SE FOMC
    const seFomcRow = resultMap.seFomc.rows[0];
    const seFomc = seFomcRow ? {
      eventDate: seFomcRow.event_date,
      eventType: seFomcRow.event_type,
      hawkishScore: seFomcRow.hawkish_score ? parseFloat(seFomcRow.hawkish_score) : null,
    } : null;

    // Process SE news
    const seNews = resultMap.seNews.rows.map(r => ({
      headline: r.headline,
      scoredAt: r.published_at,  // Using publication date, not scoring date
      sentiment: parseFloat(r.directional_sentiment),
      magnitude: r.magnitude,
    }));

    // Process SE decay alerts
    const seDecayAlerts = resultMap.seDecayAlerts.rows.map(r => ({
      id: r.id,
      createdAt: r.created_at,
      source: r.source,
      alertLevel: r.alert_level,
      alertMessage: r.alert_message,
    }));
    const decayAlertsActive = seDecayAlerts.length > 0;

    // Process SE prediction
    const sePredRow = resultMap.sePrediction.rows[0];
    const sePrediction = sePredRow ? {
      id: sePredRow.id,
      madeAt: sePredRow.made_at,
      horizon: sePredRow.horizon,
      predictedDirection: sePredRow.predicted_direction,
      predictedProb: parseFloat(sePredRow.predicted_prob),
      source: sePredRow.source,
      regimeAtPred: sePredRow.regime_at_pred,
    } : null;

    // Process Spread Sniper regime
    const ssRegimeRow = resultMap.ssRegime.rows[0];
    const ssRegime = ssRegimeRow ? {
      label: ssRegimeRow.regime,
      confidence: parseFloat(ssRegimeRow.probability),
      timestamp: ssRegimeRow.timestamp,
    } : null;

    // Process SS features (IV-RV)
    const ssFeaturesRow = resultMap.ssFeatures.rows[0];
    const ssIvRvSpread = ssFeaturesRow ? parseFloat(ssFeaturesRow.iv_rv_spread) * 100 : null; // Convert to pp

    // Process SS trading state
    const baseCash = 5000;
    const totalPnL = parseFloat(resultMap.ssTotalPnL.rows[0]?.total_pnl || 0);
    const accountValue = baseCash + totalPnL;
    const openPositions = parseInt(resultMap.ssOpenPositions.rows[0]?.count || 0);
    const exposure = parseFloat(resultMap.ssExposure.rows[0]?.total_exposure || 0);
    const exposurePercent = accountValue > 0 ? (exposure / accountValue) * 100 : 0;
    const weeklyPnL = parseFloat(resultMap.ssWeeklyPnL.rows[0]?.weekly_pnl || 0);
    const weeklyDrawdownPercent = baseCash > 0 ? (weeklyPnL / baseCash) * 100 : 0;
    const circuitBreakerActive = weeklyDrawdownPercent < -5;

    // Compute disagreements
    const ivRvDivergence = (seIvRvSpread !== null && ssIvRvSpread !== null)
      ? Math.abs(seIvRvSpread - ssIvRvSpread)
      : null;

    const regimeDisagrees = (seRegime && ssRegime)
      ? seRegime.label !== ssRegime.label
      : null;

    // Phase 3 rule states (per locked protocol backtest results)
    const phase3Rules = [
      {
        name: 'DECAY_DOWNSIZE',
        enabled: false,
        status: 'UNDERPOWERED',
        reason: 'N=0 decay alerts in history',
        currentValue: decayAlertsActive ? 'ACTIVE' : 'INACTIVE',
        threshold: 'any warning/critical alert',
        action: '50% position sizing',
      },
      {
        name: 'IVRV_DIVERGENCE',
        enabled: false,
        status: 'FAIL',
        reason: '28.6% divergence rate (methodology mismatch: VIX vs ATM IV)',
        currentValue: ivRvDivergence !== null ? `${ivRvDivergence.toFixed(2)}pp` : 'N/A',
        threshold: '> 2.0pp',
        action: 'log warning',
      },
      {
        name: 'FOMC_GATE',
        enabled: false,
        status: 'UNDERPOWERED',
        reason: 'N=1 extreme meeting out of 14',
        currentValue: seFomc?.hawkishScore !== null ? `|${seFomc.hawkishScore.toFixed(2)}|` : 'N/A',
        threshold: '> 0.25 AND FOMC within 24h',
        action: 'block premium-selling entries',
      },
    ];

    timings._total = Date.now() - startTime;

    // Log timings on first request or if any query is slow
    const slowQueries = Object.entries(timings).filter(([k, v]) => !k.startsWith('_') && v > 100);
    if (slowQueries.length > 0 || !global._unifiedTimingsLogged) {
      console.log('Unified snapshot query timings:', timings);
      if (slowQueries.length > 0) {
        console.warn('SLOW QUERIES (>100ms):', slowQueries.map(([k, v]) => `${k}: ${v}ms`).join(', '));
      }
      global._unifiedTimingsLogged = true;
    }

    res.json({
      timestamp: new Date().toISOString(),

      // Signal Engine context
      signalEngine: {
        regime: seRegime,
        vol: {
          vix: seVix,
          rv: seRv !== null ? parseFloat(seRv.toFixed(2)) : null,
          ivRvSpread: seIvRvSpread !== null ? parseFloat(seIvRvSpread.toFixed(2)) : null,
          methodology: 'VIX - 21d realized vol',
        },
        fomc: seFomc,
        news: seNews,
        decayAlerts: seDecayAlerts,
        prediction: sePrediction,
      },

      // Spread Sniper state
      spreadSniper: {
        regime: ssRegime,
        lastClassificationTimestamp: ssRegimeRow?.timestamp || null,
        ivRvSpread: ssIvRvSpread !== null ? parseFloat(ssIvRvSpread.toFixed(2)) : null,
        ivRvMethodology: 'ATM IV - 21d realized vol',
        trading: {
          openPositions,
          accountValue,
          exposure,
          exposurePercent: parseFloat(exposurePercent.toFixed(1)),
          weeklyPnL,
          weeklyDrawdownPercent: parseFloat(weeklyDrawdownPercent.toFixed(1)),
          circuitBreakerActive,
        },
      },

      // Disagreements
      disagreements: {
        regime: {
          disagrees: regimeDisagrees,
          seLabel: seRegime?.label || null,
          ssLabel: ssRegime?.label || null,
          seQuarantined: true,
          quarantineReason: 'HMM transition matrix bug: P(crisis→low_vol)=0%',
        },
        ivRv: {
          seValue: seIvRvSpread !== null ? parseFloat(seIvRvSpread.toFixed(2)) : null,
          ssValue: ssIvRvSpread !== null ? parseFloat(ssIvRvSpread.toFixed(2)) : null,
          divergence: ivRvDivergence !== null ? parseFloat(ivRvDivergence.toFixed(2)) : null,
          methodologyNote: 'SE uses VIX as IV proxy; SS uses ATM IV from options. Systematic offset expected.',
        },
      },

      // Phase 3 rules
      phase3Rules,

      _timings: timings,
    });
  } catch (error) {
    console.error('Unified snapshot error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Spread Sniper API running on port ${PORT}`);
  console.log(`Database: ${process.env.TIMESCALE_HOST}:${process.env.TIMESCALE_PORT}/${process.env.TIMESCALE_DB}`);
  console.log(`Scan history: ${SCAN_HISTORY_PATH}`);
});
