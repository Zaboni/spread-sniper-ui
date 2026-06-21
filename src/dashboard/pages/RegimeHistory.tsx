import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useRegimeHistory } from '../../hooks/useApi';

// Monospace font for numbers
const monoFont = '"JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace';

// Terminal colors
const terminalColors = {
  green: '#02cd0d',
  red: '#ef4444',
  orange: '#f59e0b',
  yellow: '#fbbf24',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  gridLine: 'rgba(148, 163, 184, 0.1)',
  tooltipBg: '#0f1218',
};

const regimeColors: Record<string, string> = {
  calm_bull: '#02cd0d',
  volatile_bull: '#f59e0b',
  calm_bear: '#fbbf24',
  volatile_bear: '#ef4444',
};

const regimeLabels: Record<string, string> = {
  calm_bull: 'CALM BULL',
  volatile_bull: 'VOLATILE BULL',
  calm_bear: 'CALM BEAR',
  volatile_bear: 'VOLATILE BEAR',
};

const regimeValues: Record<string, number> = {
  calm_bull: 4,
  volatile_bull: 3,
  calm_bear: 2,
  volatile_bear: 1,
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      timestamp: string;
      regime: string;
      probability: number;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const regime = regimeColors[data.regime] || '#64748b';

  return (
    <Card
      sx={{
        p: 1.5,
        bgcolor: terminalColors.tooltipBg,
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 1,
      }}
    >
      <Typography variant="caption" sx={{ color: terminalColors.textSecondary, fontFamily: monoFont, fontSize: '0.7rem' }}>
        {formatDateTime(data.timestamp)}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: regime,
          }}
        />
        <Typography sx={{ fontWeight: 600, color: regime, fontSize: '0.8125rem' }}>
          {regimeLabels[data.regime] || data.regime}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: terminalColors.textSecondary, mt: 0.5, fontFamily: monoFont, fontSize: '0.75rem' }}>
        Confidence: {(data.probability * 100).toFixed(1)}%
      </Typography>
    </Card>
  );
}

export default function RegimeHistory() {
  const [timeRange, setTimeRange] = useState<number>(30);
  const { data, loading, error } = useRegimeHistory(timeRange);

  const handleTimeRangeChange = (
    _: React.MouseEvent<HTMLElement>,
    newValue: number | null
  ) => {
    if (newValue !== null) {
      setTimeRange(newValue);
    }
  };

  // Process data for the chart
  const chartData = (data?.history || []).map((item) => ({
    ...item,
    regimeValue: regimeValues[item.regime] || 0,
    regimeColor: regimeColors[item.regime] || '#64748b',
  }));

  // Calculate regime distribution
  const regimeDistribution = (data?.history || []).reduce((acc, item) => {
    acc[item.regime] = (acc[item.regime] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalObservations = Object.values(regimeDistribution).reduce((a, b) => a + b, 0);

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Regime History</Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              fontFamily: monoFont,
              fontSize: '0.75rem',
              px: 2,
              color: terminalColors.textSecondary,
              borderColor: 'rgba(148, 163, 184, 0.2)',
              '&.Mui-selected': {
                backgroundColor: 'rgba(2, 205, 13, 0.15)',
                color: terminalColors.green,
                borderColor: 'rgba(2, 205, 13, 0.4)',
                '&:hover': {
                  backgroundColor: 'rgba(2, 205, 13, 0.2)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(148, 163, 184, 0.1)',
              },
            },
          }}
        >
          <ToggleButton value={7}>7D</ToggleButton>
          <ToggleButton value={30}>30D</ToggleButton>
          <ToggleButton value={90}>90D</ToggleButton>
          <ToggleButton value={180}>180D</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && (
        <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 1 }}>
          <Typography sx={{ color: '#ef4444' }}>Error loading data: {error}</Typography>
        </Box>
      )}

      {/* Regime Distribution */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(regimeLabels).map(([key, label]) => {
          const count = regimeDistribution[key] || 0;
          const percentage = totalObservations > 0 ? (count / totalObservations) * 100 : 0;
          const color = regimeColors[key];

          return (
            <Grid size={{ xs: 6, sm: 3 }} key={key}>
              <Card
                sx={{
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  {loading ? (
                    <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
                  ) : (
                    <>
                      <Typography
                        sx={{ color: terminalColors.textSecondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}
                      >
                        {label}
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 600, fontFamily: monoFont, color }}
                      >
                        {percentage.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: terminalColors.textSecondary, fontFamily: monoFont }}>
                        {count} observations
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Timeline Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Regime Timeline
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={terminalColors.gridLine} vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatDate}
                  stroke={terminalColors.textSecondary}
                  fontSize={11}
                  fontFamily={monoFont}
                  tickLine={false}
                  axisLine={{ stroke: terminalColors.gridLine }}
                />
                <YAxis
                  yAxisId="regime"
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4]}
                  tickFormatter={(value) => {
                    const labels: Record<number, string> = {
                      1: 'Vol Bear',
                      2: 'Calm Bear',
                      3: 'Vol Bull',
                      4: 'Calm Bull',
                    };
                    return labels[value] || '';
                  }}
                  stroke={terminalColors.textSecondary}
                  fontSize={10}
                  fontFamily={monoFont}
                  width={65}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="probability"
                  orientation="right"
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  stroke={terminalColors.textSecondary}
                  fontSize={11}
                  fontFamily={monoFont}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontFamily: monoFont, fontSize: 11 }}
                  formatter={(value) => <span style={{ color: terminalColors.textSecondary }}>{value}</span>}
                />

                {/* Reference line for bear/bull boundary */}
                <ReferenceLine
                  yAxisId="regime"
                  y={2.5}
                  stroke={terminalColors.gridLine}
                  strokeDasharray="5 5"
                />

                {/* Regime area */}
                <Area
                  yAxisId="regime"
                  type="stepAfter"
                  dataKey="regimeValue"
                  name="Regime"
                  stroke="none"
                  fill={terminalColors.green}
                  fillOpacity={0.15}
                />

                {/* Probability line */}
                <Line
                  yAxisId="probability"
                  type="monotone"
                  dataKey="probability"
                  name="Confidence"
                  stroke={terminalColors.green}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Regime Legend */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Regime Definitions
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  size="small"
                  label="CALM BULL"
                  sx={{
                    backgroundColor: 'rgba(2, 205, 13, 0.15)',
                    border: '1px solid rgba(2, 205, 13, 0.4)',
                    '& .MuiChip-label': {
                      color: regimeColors.calm_bull,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: terminalColors.textSecondary, fontSize: '0.8125rem' }}>
                Low volatility, upward trending market. Ideal for selling premium.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  size="small"
                  label="VOLATILE BULL"
                  sx={{
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    '& .MuiChip-label': {
                      color: regimeColors.volatile_bull,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: terminalColors.textSecondary, fontSize: '0.8125rem' }}>
                High volatility, upward trending. Exercise caution with position sizing.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  size="small"
                  label="CALM BEAR"
                  sx={{
                    backgroundColor: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgba(251, 191, 36, 0.4)',
                    '& .MuiChip-label': {
                      color: regimeColors.calm_bear,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: terminalColors.textSecondary, fontSize: '0.8125rem' }}>
                Low volatility, downward trending. Reduced position sizing recommended.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  size="small"
                  label="VOLATILE BEAR"
                  sx={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    '& .MuiChip-label': {
                      color: regimeColors.volatile_bear,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: terminalColors.textSecondary, fontSize: '0.8125rem' }}>
                High volatility, downward trending. Avoid new positions, hedge existing.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}
