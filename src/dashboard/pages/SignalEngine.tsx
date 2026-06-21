import { memo, useMemo } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import {
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceArea,
  Tooltip,
} from 'recharts';
import {
  useSignalEngineSnapshot,
  type SnapshotNews,
  type SnapshotFomc,
  type SnapshotRegime,
  type SnapshotPrediction,
  type SnapshotPredictionAccuracy,
  type DecayAlert,
  type RegimeProbs,
} from '../../hooks/useSignalEngine';

// =============================================================================
// CONSTANTS
// =============================================================================

const monoFont = '"JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace';

const colors = {
  green: '#02cd0d',
  red: '#ef4444',
  orange: '#f59e0b',
  yellow: '#fbbf24',
  blue: '#3b82f6',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  cardBg: 'rgba(15, 18, 24, 0.6)',
  border: 'rgba(148, 163, 184, 0.15)',
};

const regimeColors: Record<string, string> = {
  low_vol: colors.green,
  high_vol: colors.orange,
  crisis: colors.red,
};

const regimeLabels: Record<string, string> = {
  low_vol: 'LOW VOL',
  high_vol: 'HIGH VOL',
  crisis: 'CRISIS',
};

const MIN_PREDICTIONS_FOR_ACCURACY = 10;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
}

function getDataAge(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function getSentimentColor(sentiment: number, magnitude: string): string {
  const intensity = magnitude === 'major' ? 1 : magnitude === 'material' ? 0.7 : 0.4;
  if (sentiment > 0.1) {
    return `rgba(2, 205, 13, ${intensity})`;
  } else if (sentiment < -0.1) {
    return `rgba(239, 68, 68, ${intensity})`;
  }
  return `rgba(148, 163, 184, ${intensity})`;
}

// =============================================================================
// TODAY'S LEAN CARD
// =============================================================================

interface TodaysLeanCardProps {
  prediction: SnapshotPrediction | null;
}

const TodaysLeanCard = memo(function TodaysLeanCard({ prediction }: TodaysLeanCardProps) {
  if (!prediction) {
    return (
      <Card sx={{ bgcolor: colors.cardBg, border: `1px solid ${colors.border}`, mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Typography sx={{ fontSize: '0.7rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
            Today's Lean
          </Typography>
          <Typography sx={{ fontSize: '1rem', color: colors.textSecondary }}>
            No prediction yet
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const isBull = prediction.predictedDirection === 'bull';
  const isBear = prediction.predictedDirection === 'bear';
  const directionColor = isBull ? colors.green : isBear ? colors.red : colors.textSecondary;
  const directionLabel = prediction.predictedDirection.toUpperCase();
  const probPct = (prediction.predictedProb * 100).toFixed(1);
  const regimeColor = prediction.regimeAtPred ? regimeColors[prediction.regimeAtPred] : colors.textSecondary;
  const regimeLabel = prediction.regimeAtPred ? regimeLabels[prediction.regimeAtPred] : '--';

  return (
    <Card sx={{ bgcolor: colors.cardBg, border: `1px solid ${colors.border}`, mb: 2 }}>
      <CardContent sx={{ py: 2.5 }}>
        <Typography sx={{ fontSize: '0.7rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
          Today's Lean
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {/* Direction + Probability */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <Typography
              sx={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: directionColor,
                lineHeight: 1,
                textShadow: `0 0 30px ${directionColor}50`,
                transition: 'color 0.3s ease',
              }}
            >
              {directionLabel}
            </Typography>
            <Typography
              sx={{
                fontSize: '2rem',
                fontWeight: 600,
                fontFamily: monoFont,
                color: directionColor,
                lineHeight: 1,
                transition: 'color 0.3s ease',
              }}
            >
              {probPct}%
            </Typography>
          </Box>

          {/* Source */}
          <Box>
            <Typography sx={{ fontSize: '0.6rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Source
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', fontFamily: monoFont, color: colors.text }}>
              {prediction.source}
            </Typography>
          </Box>

          {/* Regime Context */}
          <Box>
            <Typography sx={{ fontSize: '0.6rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Regime
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: regimeColor }}>
              {regimeLabel}
            </Typography>
          </Box>

          {/* Timestamp */}
          <Box sx={{ ml: 'auto' }}>
            <Typography sx={{ fontSize: '0.65rem', color: colors.textSecondary, fontFamily: monoFont }}>
              {formatDate(prediction.madeAt)} {formatTime(prediction.madeAt)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

// =============================================================================
// MAIN CHART (SPY + VIX + REGIME BANDS)
// =============================================================================

interface MainChartDataPoint {
  date: string;
  dateLabel: string;
  spy: number;
  vix: number;
  regime: string;
}

interface MainChartProps {
  spyHistory: Array<{ ts: string; close: number }>;
  vixHistory: Array<{ ts: string; value: number }>;
  regimeHistory: Array<{ ts: string; label: string }>;
}

const MainChart = memo(function MainChart({ spyHistory, vixHistory, regimeHistory }: MainChartProps) {
  const chartData = useMemo(() => {
    if (spyHistory.length === 0) return [];

    // Build a map of VIX by date
    const vixByDate = new Map<string, number>();
    for (const v of vixHistory) {
      const dateKey = new Date(v.ts).toISOString().split('T')[0];
      vixByDate.set(dateKey, v.value);
    }

    // Build a map of regime by date (use most recent regime at or before each date)
    const regimeByDate = new Map<string, string>();
    const sortedRegimes = [...regimeHistory].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    let lastRegime = 'low_vol';
    for (const r of sortedRegimes) {
      const dateKey = new Date(r.ts).toISOString().split('T')[0];
      lastRegime = r.label;
      regimeByDate.set(dateKey, lastRegime);
    }

    // Process SPY history and join with VIX and regime
    const data: MainChartDataPoint[] = [];
    let currentRegime = sortedRegimes.length > 0 ? sortedRegimes[0].label : 'low_vol';

    for (const s of spyHistory) {
      const dateKey = new Date(s.ts).toISOString().split('T')[0];
      const vix = vixByDate.get(dateKey);
      if (regimeByDate.has(dateKey)) {
        currentRegime = regimeByDate.get(dateKey)!;
      }

      if (vix !== undefined) {
        data.push({
          date: dateKey,
          dateLabel: formatDateShort(s.ts),
          spy: s.close,
          vix,
          regime: currentRegime,
        });
      }
    }

    return data;
  }, [spyHistory, vixHistory, regimeHistory]);

  // Generate regime band reference areas
  const regimeBands = useMemo(() => {
    if (chartData.length === 0) return [];

    const bands: Array<{ x1: string; x2: string; color: string }> = [];
    let bandStart = 0;
    let currentRegime = chartData[0].regime;

    for (let i = 1; i <= chartData.length; i++) {
      const regime = i < chartData.length ? chartData[i].regime : null;
      if (regime !== currentRegime || i === chartData.length) {
        bands.push({
          x1: chartData[bandStart].date,
          x2: chartData[i - 1].date,
          color: regimeColors[currentRegime] || colors.textSecondary,
        });
        if (i < chartData.length) {
          bandStart = i;
          currentRegime = regime!;
        }
      }
    }

    return bands;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card sx={{ bgcolor: colors.cardBg, border: `1px solid ${colors.border}`, mb: 2 }}>
        <CardContent>
          <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
        </CardContent>
      </Card>
    );
  }

  const spyMin = Math.min(...chartData.map(d => d.spy));
  const spyMax = Math.max(...chartData.map(d => d.spy));
  const spyPadding = (spyMax - spyMin) * 0.05;
  const vixMin = Math.min(...chartData.map(d => d.vix));
  const vixMax = Math.max(...chartData.map(d => d.vix));
  const vixPadding = (vixMax - vixMin) * 0.1;

  return (
    <Card sx={{ bgcolor: colors.cardBg, border: `1px solid ${colors.border}`, mb: 2 }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ fontSize: '0.7rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SPY & VIX — 90 Days
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 2, bgcolor: colors.blue, borderRadius: 1 }} />
              <Typography sx={{ fontSize: '0.6rem', color: colors.textSecondary }}>SPY</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 2, bgcolor: colors.orange, borderRadius: 1 }} />
              <Typography sx={{ fontSize: '0.6rem', color: colors.textSecondary }}>VIX</Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ height: 260, mx: -1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 45, left: 5, bottom: 30 }}>
              {/* Regime bands at the bottom */}
              {regimeBands.map((band, idx) => (
                <ReferenceArea
                  key={idx}
                  x1={band.x1}
                  x2={band.x2}
                  y1={spyMin - spyPadding}
                  y2={spyMin - spyPadding + (spyMax - spyMin) * 0.03}
                  fill={band.color}
                  fillOpacity={0.8}
                  yAxisId="left"
                />
              ))}
              <XAxis
                dataKey="date"
                axisLine={{ stroke: colors.border }}
                tickLine={false}
                tick={{ fill: colors.textSecondary, fontSize: 10 }}
                tickFormatter={(val) => formatDateShort(val)}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                yAxisId="left"
                domain={[spyMin - spyPadding, spyMax + spyPadding]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: colors.blue, fontSize: 10, fontFamily: monoFont }}
                tickFormatter={(val) => val.toFixed(0)}
                width={40}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[vixMin - vixPadding, vixMax + vixPadding]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: colors.orange, fontSize: 10, fontFamily: monoFont }}
                tickFormatter={(val) => val.toFixed(0)}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 18, 24, 0.95)',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: monoFont,
                }}
                labelStyle={{ color: colors.text }}
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(2) : String(value),
                  name === 'spy' ? 'SPY' : 'VIX',
                ]}
                labelFormatter={(label) => formatDate(String(label))}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spy"
                stroke={colors.blue}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="vix"
                stroke={colors.orange}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
        {/* Regime legend */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 0.5 }}>
          {(['low_vol', 'high_vol', 'crisis'] as const).map((regime) => (
            <Box key={regime} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 6, bgcolor: regimeColors[regime], borderRadius: 0.5 }} />
              <Typography sx={{ fontSize: '0.55rem', color: colors.textSecondary }}>
                {regimeLabels[regime]}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
});

// =============================================================================
// ACCURACY PANEL
// =============================================================================

interface AccuracyPanelProps {
  accuracy: SnapshotPredictionAccuracy;
  alerts: DecayAlert[];
}

const AccuracyPanel = memo(function AccuracyPanel({ accuracy, alerts }: AccuracyPanelProps) {
  const { totalResolved, predictions } = accuracy;

  // Compute hit rate and cumulative accuracy
  const stats = useMemo(() => {
    if (predictions.length === 0) {
      return { hitRate: null, last30: [], cumulative: [] };
    }

    const correctCount = predictions.filter(p => p.correct).length;
    const hitRate = correctCount / predictions.length;

    // Last 30 for dots (most recent first)
    const last30 = predictions.slice(0, 30);

    // Cumulative accuracy over time (reverse to chronological order)
    const chronological = [...predictions].reverse();
    let runningCorrect = 0;
    const cumulative = chronological.map((p, idx) => {
      if (p.correct) runningCorrect++;
      return {
        idx: idx + 1,
        accuracy: runningCorrect / (idx + 1),
      };
    });

    return { hitRate, last30, cumulative };
  }, [predictions]);

  const hasEnoughData = totalResolved >= MIN_PREDICTIONS_FOR_ACCURACY;

  return (
    <Card sx={{ bgcolor: colors.cardBg, border: `1px solid ${colors.border}`, height: '100%' }}>
      <CardContent>
        <Typography sx={{ fontSize: '0.7rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
          Prediction Accuracy
        </Typography>

        {!hasEnoughData ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, mb: 1 }}>
              Not enough data yet
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, fontFamily: monoFont }}>
              {totalResolved} / {MIN_PREDICTIONS_FOR_ACCURACY} predictions resolved
            </Typography>
          </Box>
        ) : (
          <>
            {/* Hit Rate */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.6rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Hit Rate
              </Typography>
              <Typography
                sx={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  fontFamily: monoFont,
                  color: stats.hitRate !== null && stats.hitRate >= 0.5 ? colors.green : colors.red,
                  lineHeight: 1.2,
                  transition: 'color 0.3s ease',
                }}
              >
                {stats.hitRate !== null ? `${(stats.hitRate * 100).toFixed(1)}%` : '--'}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: colors.textSecondary, fontFamily: monoFont }}>
                N={totalResolved}
              </Typography>
            </Box>

            {/* Last 30 dots */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.6rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>
                Last {stats.last30.length}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                {stats.last30.map((p, idx) => (
                  <Box
                    key={p.id}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: p.correct ? colors.green : colors.red,
                      opacity: 1 - (idx * 0.015),
                      transition: 'background-color 0.3s ease',
                    }}
                    title={`${formatDate(p.madeAt)}: ${p.predictedDirection} - ${p.correct ? 'correct' : 'wrong'}`}
                  />
                ))}
              </Box>
            </Box>

            {/* Cumulative accuracy chart */}
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                Cumulative
              </Typography>
              <Box sx={{ height: 60, mx: -1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.cumulative} margin={{ top: 2, right: 5, left: 5, bottom: 2 }}>
                    <YAxis domain={[0, 1]} hide />
                    {/* 50% reference line */}
                    <ReferenceArea y1={0.5} y2={0.5} stroke={colors.textSecondary} strokeDasharray="3 3" fillOpacity={0} />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke={stats.hitRate !== null && stats.hitRate >= 0.5 ? colors.green : colors.red}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </>
        )}

        {/* Decay Alerts */}
        {alerts.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${colors.border}` }}>
            <Typography sx={{ fontSize: '0.6rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
              Decay Alerts
            </Typography>
            {alerts.map((alert) => (
              <Box
                key={alert.id}
                sx={{
                  p: 1,
                  mb: 0.5,
                  borderRadius: 0.5,
                  bgcolor: alert.alertLevel === 'critical'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                  borderLeft: `3px solid ${alert.alertLevel === 'critical' ? colors.red : colors.orange}`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                  <Typography sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    fontFamily: monoFont,
                    color: alert.alertLevel === 'critical' ? colors.red : colors.orange,
                    textTransform: 'uppercase',
                  }}>
                    {alert.alertLevel}
                  </Typography>
                  <Typography sx={{ fontSize: '0.55rem', color: colors.textSecondary, fontFamily: monoFont }}>
                    {alert.source}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.6rem', color: colors.text, lineHeight: 1.3 }}>
                  {alert.alertMessage}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

// =============================================================================
// REGIME CARD (unchanged)
// =============================================================================

interface RegimeCardProps {
  regime: SnapshotRegime | null;
}

const RegimeCard = memo(function RegimeCard({ regime }: RegimeCardProps) {
  if (!regime) {
    return (
      <Card sx={{ bgcolor: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <CardContent>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
        </CardContent>
      </Card>
    );
  }

  const color = regimeColors[regime.label] || colors.textSecondary;
  const probs = regime.probs || {};

  return (
    <Card sx={{ bgcolor: colors.cardBg, border: `1px solid ${colors.border}` }}>
      <CardContent sx={{ py: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          {/* Current State */}
          <Box sx={{ minWidth: 140 }}>
            <Typography sx={{ fontSize: '0.7rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
              Current Regime
            </Typography>
            <Typography
              sx={{
                fontSize: '2rem',
                fontWeight: 700,
                color,
                lineHeight: 1,
                textShadow: `0 0 20px ${color}40`,
              }}
            >
              {regimeLabels[regime.label] || regime.label.toUpperCase()}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: colors.textSecondary, fontFamily: monoFont, mt: 1 }}>
              {formatDate(regime.timestamp)} {formatTime(regime.timestamp)}
            </Typography>
          </Box>

          {/* Probability Bars */}
          <Box sx={{ flex: 1, maxWidth: 400 }}>
            <Typography sx={{ fontSize: '0.7rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
              State Probabilities
            </Typography>
            {(['low_vol', 'high_vol', 'crisis'] as const).map(key => {
              const prob = (probs as RegimeProbs)[key] || 0;
              const barColor = regimeColors[key];
              return (
                <Box key={key} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: barColor, fontWeight: 500 }}>
                      {regimeLabels[key]}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', fontFamily: monoFont, color: colors.text }}>
                      {(prob * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 6,
                      bgcolor: 'rgba(148, 163, 184, 0.1)',
                      borderRadius: 0.5,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${prob * 100}%`,
                        bgcolor: barColor,
                        borderRadius: 0.5,
                        transition: 'width 0.5s ease-out',
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

// =============================================================================
// NEWS CARD (unchanged)
// =============================================================================

interface NewsCardProps {
  news: SnapshotNews;
}

const NewsCard = memo(function NewsCard({ news }: NewsCardProps) {
  const borderColor = getSentimentColor(news.sentiment, news.magnitude);

  return (
    <Box
      sx={{
        p: 1.5,
        borderLeft: `4px solid ${borderColor}`,
        bgcolor: colors.cardBg,
        borderRadius: '0 4px 4px 0',
        mb: 1,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.8rem',
          color: colors.text,
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {news.headline}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, mt: 0.75, alignItems: 'center' }}>
        <Typography sx={{ fontSize: '0.65rem', color: colors.textSecondary, fontFamily: monoFont }}>
          {formatDate(news.scoredAt)}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontFamily: monoFont,
            fontWeight: 600,
            color: news.sentiment > 0.1 ? colors.green : news.sentiment < -0.1 ? colors.red : colors.textSecondary,
          }}
        >
          {news.sentiment > 0 ? '+' : ''}{news.sentiment.toFixed(2)}
        </Typography>
        <Box
          sx={{
            fontSize: '0.55rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            px: 0.75,
            py: 0.2,
            borderRadius: 0.5,
            bgcolor: news.magnitude === 'major' ? 'rgba(239, 68, 68, 0.2)' :
                     news.magnitude === 'material' ? 'rgba(245, 158, 11, 0.2)' :
                     'rgba(148, 163, 184, 0.15)',
            color: news.magnitude === 'major' ? colors.red :
                   news.magnitude === 'material' ? colors.orange :
                   colors.textSecondary,
          }}
        >
          {news.magnitude}
        </Box>
      </Box>
    </Box>
  );
});

// =============================================================================
// FOMC CARD (unchanged)
// =============================================================================

interface FomcCardProps {
  fomc: SnapshotFomc | null;
}

const FomcCard = memo(function FomcCard({ fomc }: FomcCardProps) {
  if (!fomc) {
    return (
      <Card sx={{ bgcolor: colors.cardBg, border: `1px solid ${colors.border}`, height: '100%' }}>
        <CardContent>
          <Typography sx={{ fontSize: '0.7rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
            Latest FOMC
          </Typography>
          <Typography sx={{ color: colors.textSecondary }}>No data</Typography>
        </CardContent>
      </Card>
    );
  }

  const score = fomc.hawkishScore ?? 0;
  const markerPosition = ((score + 1) / 2) * 100;

  return (
    <Card sx={{ bgcolor: colors.cardBg, border: `1px solid ${colors.border}`, height: '100%' }}>
      <CardContent>
        <Typography sx={{ fontSize: '0.7rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
          Latest FOMC
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontFamily: monoFont, color: colors.text }}>
            {formatDateFull(fomc.eventDate)}
          </Typography>
          <Box
            sx={{
              fontSize: '0.6rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              px: 1,
              py: 0.3,
              borderRadius: 0.5,
              bgcolor: 'rgba(59, 130, 246, 0.2)',
              color: colors.blue,
            }}
          >
            {fomc.eventType}
          </Box>
        </Box>

        {/* Hawkish Score Slider */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.6rem', color: colors.green }}>DOVISH</Typography>
            <Typography sx={{ fontSize: '0.6rem', color: colors.red }}>HAWKISH</Typography>
          </Box>
          <Box
            sx={{
              position: 'relative',
              height: 8,
              bgcolor: 'rgba(148, 163, 184, 0.1)',
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: 1,
                background: `linear-gradient(to right, ${colors.green}, ${colors.textSecondary}, ${colors.red})`,
                opacity: 0.4,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 1,
                bgcolor: colors.textSecondary,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                left: `${markerPosition}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: score > 0.2 ? colors.red : score < -0.2 ? colors.green : colors.textSecondary,
                border: `2px solid ${colors.text}`,
                boxShadow: `0 0 8px ${score > 0.2 ? colors.red : score < -0.2 ? colors.green : colors.textSecondary}`,
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography sx={{ fontSize: '0.6rem', fontFamily: monoFont, color: colors.textSecondary }}>-1</Typography>
            <Typography sx={{ fontSize: '0.75rem', fontFamily: monoFont, fontWeight: 600, color: colors.text }}>
              {score > 0 ? '+' : ''}{score.toFixed(2)}
            </Typography>
            <Typography sx={{ fontSize: '0.6rem', fontFamily: monoFont, color: colors.textSecondary }}>+1</Typography>
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.65rem', color: colors.textSecondary, fontFamily: monoFont }}>
          {getDataAge(fomc.eventDate)}
        </Typography>
      </CardContent>
    </Card>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SignalEngine() {
  const { data, loading, error, lastUpdated } = useSignalEngineSnapshot(60000);

  if (loading && !data) {
    return (
      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1, mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' }, gap: 2 }}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Signal Engine</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {error && (
            <Typography sx={{ fontSize: '0.7rem', color: colors.red }}>
              Error: {error}
            </Typography>
          )}
          {lastUpdated && (
            <Typography sx={{ fontSize: '0.65rem', color: colors.textSecondary, fontFamily: monoFont }}>
              Updated {formatTime(lastUpdated.toISOString())}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Today's Lean - TOP */}
      <TodaysLeanCard prediction={data?.latestPrediction || null} />

      {/* Regime Card */}
      <Box sx={{ mb: 2 }}>
        <RegimeCard regime={data?.regime || null} />
      </Box>

      {/* Main Chart */}
      <MainChart
        spyHistory={data?.spy.history || []}
        vixHistory={data?.vol.vixHistory || []}
        regimeHistory={data?.regimeHistory || []}
      />

      {/* Bottom Row: Accuracy + News + FOMC */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' }, gap: 2 }}>
        {/* Accuracy Panel */}
        <AccuracyPanel
          accuracy={data?.predictionAccuracy || { totalResolved: 0, predictions: [] }}
          alerts={data?.decayAlerts || []}
        />

        {/* News Feed */}
        <Card sx={{ bgcolor: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <CardContent>
            <Typography sx={{ fontSize: '0.7rem', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
              Recent News Scores
            </Typography>
            <Box sx={{ maxHeight: 240, overflowY: 'auto', pr: 1 }}>
              {data?.news && data.news.length > 0 ? (
                data.news.map((item, idx) => (
                  <NewsCard key={`${item.scoredAt}-${idx}`} news={item} />
                ))
              ) : (
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.8rem' }}>
                  No recent news scores
                </Typography>
              )}
            </Box>
            {data?.news && data.news.length > 0 && (
              <Typography sx={{ fontSize: '0.65rem', color: colors.textSecondary, fontFamily: monoFont, mt: 1.5 }}>
                Latest: {getDataAge(data.news[0].scoredAt)}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* FOMC */}
        <FomcCard fomc={data?.fomc || null} />
      </Box>
    </Container>
  );
}
