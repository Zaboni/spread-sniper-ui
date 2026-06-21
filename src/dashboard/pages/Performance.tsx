import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { usePerformance } from '../../hooks/useApi';

// Monospace font for numbers
const monoFont = '"JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace';

// Terminal color palette
const terminalColors = {
  green: '#02cd0d',
  red: '#ef4444',
  orange: '#f59e0b',
  yellow: '#fbbf24',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  gridLine: 'rgba(148, 163, 184, 0.1)',
  cardBg: '#1a1f2e',
  tooltipBg: '#0f1218',
};

const regimeColors: Record<string, string> = {
  calm_bull: '#02cd0d',
  volatile_bull: '#f59e0b',
  calm_bear: '#fbbf24',
  volatile_bear: '#ef4444',
  Unknown: '#64748b',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function Performance() {
  const { data, loading, error } = usePerformance();

  const chartColors = {
    primary: terminalColors.green,
    success: terminalColors.green,
    error: terminalColors.red,
    warning: terminalColors.orange,
    line: terminalColors.textSecondary,
    grid: terminalColors.gridLine,
  };

  const winRateData = data ? [
    { name: 'Wins', value: data.winRate.wins, color: chartColors.success },
    { name: 'Losses', value: data.winRate.losses, color: chartColors.error },
  ] : [];

  const tooltipStyle = {
    backgroundColor: terminalColors.tooltipBg,
    border: `1px solid rgba(148, 163, 184, 0.2)`,
    borderRadius: '6px',
    padding: '8px 12px',
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Performance
      </Typography>

      {error && (
        <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 1 }}>
          <Typography sx={{ color: '#ef4444' }}>Error loading data: {error}</Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Equity Curve */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Equity Curve
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data?.equityCurve || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke={chartColors.line}
                      fontSize={11}
                      fontFamily={monoFont}
                      tickLine={false}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v)}
                      stroke={chartColors.line}
                      fontSize={11}
                      fontFamily={monoFont}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Equity']}
                      labelFormatter={(label) => formatDate(String(label))}
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: terminalColors.textSecondary, fontFamily: monoFont, fontSize: 11 }}
                      itemStyle={{ color: terminalColors.green, fontFamily: monoFont }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={chartColors.primary}
                      fill={chartColors.primary}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Win Rate Donut */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Win Rate
              </Typography>
              {loading ? (
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
              ) : (
                <Box sx={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={winRateData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        labelLine={false}
                        stroke="none"
                      >
                        {winRateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [Number(value), String(name)]}
                        contentStyle={tooltipStyle}
                        itemStyle={{ fontFamily: monoFont }}
                      />
                      <Legend
                        wrapperStyle={{ fontFamily: monoFont, fontSize: 12 }}
                        formatter={(value) => <span style={{ color: terminalColors.textSecondary }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -70%)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 600, color: chartColors.success, fontFamily: monoFont }}
                    >
                      {data?.winRate.percentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: terminalColors.textSecondary, fontFamily: monoFont }}>
                      {data?.winRate.total} trades
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Drawdown Chart */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Drawdown
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data?.drawdown || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke={chartColors.line}
                      fontSize={11}
                      fontFamily={monoFont}
                      tickLine={false}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v)}
                      stroke={chartColors.line}
                      fontSize={11}
                      fontFamily={monoFont}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Drawdown']}
                      labelFormatter={(label) => formatDate(String(label))}
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: terminalColors.textSecondary, fontFamily: monoFont, fontSize: 11 }}
                      itemStyle={{ color: terminalColors.red, fontFamily: monoFont }}
                    />
                    <Area
                      type="monotone"
                      dataKey="drawdown"
                      stroke={chartColors.error}
                      fill={chartColors.error}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* P&L by Strategy */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                P&L by Strategy
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 1 }} />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data?.strategyPnL || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatCurrency(v)}
                      stroke={chartColors.line}
                      fontSize={11}
                      fontFamily={monoFont}
                      tickLine={false}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <YAxis
                      type="category"
                      dataKey="strategy"
                      stroke={chartColors.line}
                      fontSize={11}
                      fontFamily={monoFont}
                      width={100}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        name === 'pnl' ? 'P&L' : String(name)
                      ]}
                      contentStyle={tooltipStyle}
                      itemStyle={{ fontFamily: monoFont }}
                    />
                    <Bar
                      dataKey="pnl"
                      fill={chartColors.primary}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* P&L by Regime */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                P&L by Regime
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 1 }} />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data?.regimePnL || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatCurrency(v)}
                      stroke={chartColors.line}
                      fontSize={11}
                      fontFamily={monoFont}
                      tickLine={false}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <YAxis
                      type="category"
                      dataKey="regime"
                      stroke={chartColors.line}
                      fontSize={11}
                      fontFamily={monoFont}
                      width={100}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        name === 'pnl' ? 'P&L' : String(name)
                      ]}
                      contentStyle={tooltipStyle}
                      itemStyle={{ fontFamily: monoFont }}
                    />
                    <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                      {(data?.regimePnL || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={regimeColors[entry.regime] || regimeColors.Unknown}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Returns */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Monthly Returns
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data?.monthlyReturns || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonth}
                      stroke={chartColors.line}
                      fontSize={11}
                      fontFamily={monoFont}
                      tickLine={false}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v)}
                      stroke={chartColors.line}
                      fontSize={11}
                      fontFamily={monoFont}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'P&L']}
                      labelFormatter={(label) => formatMonth(String(label))}
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: terminalColors.textSecondary, fontFamily: monoFont, fontSize: 11 }}
                      itemStyle={{ fontFamily: monoFont }}
                    />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {(data?.monthlyReturns || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.pnl >= 0 ? chartColors.success : chartColors.error}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
