import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { useRisk } from '../../hooks/useApi';

// Monospace font for numbers
const monoFont = '"JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace';

// Terminal colors
const terminalColors = {
  green: '#02cd0d',
  red: '#ef4444',
  orange: '#f59e0b',
  yellow: '#fbbf24',
  blue: '#3b82f6',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  cardBg: '#1a1f2e',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

interface GaugeProps {
  value: number;
  max: number;
  label: string;
  formatValue?: (v: number) => string;
}

function Gauge({ value, max, label, formatValue }: GaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const getColor = () => {
    if (percentage >= 80) return terminalColors.red;
    if (percentage >= 60) return terminalColors.orange;
    return terminalColors.green;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ color: terminalColors.textSecondary, fontSize: '0.8125rem' }}>
          {label}
        </Typography>
        <Typography sx={{ fontFamily: monoFont, fontSize: '0.8125rem', fontWeight: 600 }}>
          {formatValue ? formatValue(value) : value} / {formatValue ? formatValue(max) : max}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'rgba(148, 163, 184, 0.15)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            bgcolor: getColor(),
          },
        }}
      />
      <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: terminalColors.textSecondary, fontFamily: monoFont }}>
        {formatPercent(percentage)} utilized
      </Typography>
    </Box>
  );
}

interface DrawdownMeterProps {
  label: string;
  amount: number;
  percent: number;
  threshold: number;
  loading?: boolean;
}

function DrawdownMeter({ label, amount, percent, threshold, loading }: DrawdownMeterProps) {
  const isOverThreshold = percent < -threshold;
  const normalizedPercent = Math.min(Math.abs(percent) / threshold * 100, 100);

  const getColor = () => {
    if (isOverThreshold) return terminalColors.red;
    if (normalizedPercent >= 70) return terminalColors.orange;
    return terminalColors.green;
  };

  if (loading) {
    return <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />;
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', color: terminalColors.textSecondary }}
          >
            {label}
          </Typography>
          {isOverThreshold ? (
            <Chip
              size="small"
              icon={<ErrorIcon sx={{ fontSize: 14 }} />}
              label="EXCEEDED"
              sx={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                '& .MuiChip-label': { color: terminalColors.red, fontWeight: 600, fontSize: '0.65rem' },
                '& .MuiChip-icon': { color: terminalColors.red },
              }}
            />
          ) : (
            <Chip
              size="small"
              icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
              label="OK"
              sx={{
                backgroundColor: 'rgba(2, 205, 13, 0.15)',
                border: '1px solid rgba(2, 205, 13, 0.4)',
                '& .MuiChip-label': { color: terminalColors.green, fontWeight: 600, fontSize: '0.65rem' },
                '& .MuiChip-icon': { color: terminalColors.green },
              }}
            />
          )}
        </Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            fontFamily: monoFont,
            color: amount < 0 ? terminalColors.red : terminalColors.green,
            mb: 2,
          }}
        >
          {formatCurrency(amount)}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={normalizedPercent}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: 'rgba(148, 163, 184, 0.15)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              bgcolor: getColor(),
            },
          }}
        />
        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: terminalColors.textSecondary, fontFamily: monoFont }}>
          {formatPercent(Math.abs(percent))} of {formatPercent(threshold)} threshold
        </Typography>
      </CardContent>
    </Card>
  );
}

interface StatusCardProps {
  title: string;
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  description: string;
  loading?: boolean;
}

function StatusCard({ title, active, activeLabel, inactiveLabel, description, loading }: StatusCardProps) {
  if (loading) {
    return <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 1 }} />;
  }

  return (
    <Card
      sx={{
        ...(active && {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
        }),
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', color: active ? terminalColors.red : terminalColors.textSecondary }}
          >
            {title}
          </Typography>
          {active ? (
            <ErrorIcon sx={{ color: terminalColors.red }} />
          ) : (
            <CheckCircleIcon sx={{ color: terminalColors.green }} />
          )}
        </Box>
        <Chip
          size="small"
          label={active ? activeLabel : inactiveLabel}
          sx={{
            mb: 1.5,
            backgroundColor: active ? 'rgba(239, 68, 68, 0.15)' : 'rgba(2, 205, 13, 0.15)',
            border: `1px solid ${active ? 'rgba(239, 68, 68, 0.4)' : 'rgba(2, 205, 13, 0.4)'}`,
            '& .MuiChip-label': {
              color: active ? terminalColors.red : terminalColors.green,
              fontWeight: 600,
              fontSize: '0.7rem',
            },
          }}
        />
        <Typography variant="body2" sx={{ color: terminalColors.textSecondary, fontSize: '0.8125rem' }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Risk() {
  const { data, loading, error } = useRisk();

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Risk Management
      </Typography>

      {error && (
        <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 1 }}>
          <Typography sx={{ color: '#ef4444' }}>Error loading data: {error}</Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Account Overview */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 3, fontWeight: 600 }}
              >
                Account Overview
              </Typography>
              {loading ? (
                <>
                  <Skeleton variant="text" height={60} />
                  <Skeleton variant="text" height={60} />
                </>
              ) : (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      sx={{ color: terminalColors.textSecondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}
                    >
                      Account Value
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 600, fontFamily: monoFont, color: terminalColors.text }}
                    >
                      {formatCurrency(data?.accountValue ?? 5000)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      sx={{ color: terminalColors.textSecondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}
                    >
                      Settled Cash
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 600, fontFamily: monoFont, color: terminalColors.green }}
                    >
                      {formatCurrency(data?.settledCash ?? 5000)}
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Exposure Gauge */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 3, fontWeight: 600 }}
              >
                Current Exposure
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
              ) : (
                <>
                  <Gauge
                    value={data?.exposure.percent ?? 0}
                    max={data?.exposure.maxPercent ?? 20}
                    label="Portfolio Exposure"
                    formatValue={(v) => formatPercent(v)}
                  />
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography
                        sx={{ color: terminalColors.textSecondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}
                      >
                        Current Exposure
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontFamily: monoFont }}>
                        {formatCurrency(data?.exposure.current ?? 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        sx={{ color: terminalColors.textSecondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}
                      >
                        Max Allowed (20%)
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontFamily: monoFont }}>
                        {formatCurrency((data?.accountValue ?? 5000) * 0.20)}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Drawdown Meters */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DrawdownMeter
            label="Weekly Drawdown"
            amount={data?.drawdown.weekly.amount ?? 0}
            percent={data?.drawdown.weekly.percent ?? 0}
            threshold={5}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DrawdownMeter
            label="Monthly Drawdown"
            amount={data?.drawdown.monthly.amount ?? 0}
            percent={data?.drawdown.monthly.percent ?? 0}
            threshold={10}
            loading={loading}
          />
        </Grid>

        {/* Safety Switches */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ mb: 2, mt: 2, fontWeight: 600 }}>
            Safety Switches
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatusCard
            title="Circuit Breaker"
            active={data?.circuitBreakerActive ?? false}
            activeLabel="TRIGGERED"
            inactiveLabel="INACTIVE"
            description="Stops trading when weekly drawdown exceeds 5% or monthly exceeds 10%"
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatusCard
            title="Backwardation Kill Switch"
            active={data?.backwardationActive ?? false}
            activeLabel="TRIGGERED"
            inactiveLabel="INACTIVE"
            description="Halts trading when VIX futures are in backwardation"
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', color: terminalColors.textSecondary }}
                >
                  Correlated Index Positions
                </Typography>
                {loading ? (
                  <Skeleton variant="circular" width={24} height={24} />
                ) : (data?.correlatedIndexPositions.count ?? 0) >= (data?.correlatedIndexPositions.max ?? 3) ? (
                  <WarningIcon sx={{ color: terminalColors.orange }} />
                ) : (
                  <CheckCircleIcon sx={{ color: terminalColors.green }} />
                )}
              </Box>
              {loading ? (
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 600, fontFamily: monoFont, color: terminalColors.text }}
                    >
                      {data?.correlatedIndexPositions.count ?? 0}
                    </Typography>
                    <Typography sx={{ color: terminalColors.textSecondary, fontFamily: monoFont }}>
                      / {data?.correlatedIndexPositions.max ?? 3} max
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: terminalColors.textSecondary, fontSize: '0.8125rem' }}>
                    Concurrent positions in correlated indexes (SPY, QQQ, IWM)
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Summary */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Risk Summary
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
              ) : (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography
                      sx={{ color: terminalColors.textSecondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}
                    >
                      Exposure %
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontFamily: monoFont,
                        color: (data?.exposure.percent ?? 0) > 15 ? terminalColors.orange : terminalColors.green,
                      }}
                    >
                      {formatPercent(data?.exposure.percent ?? 0)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography
                      sx={{ color: terminalColors.textSecondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}
                    >
                      Weekly P&L
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontFamily: monoFont,
                        color: (data?.drawdown.weekly.amount ?? 0) >= 0 ? terminalColors.green : terminalColors.red,
                      }}
                    >
                      {formatCurrency(data?.drawdown.weekly.amount ?? 0)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography
                      sx={{ color: terminalColors.textSecondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}
                    >
                      Monthly P&L
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontFamily: monoFont,
                        color: (data?.drawdown.monthly.amount ?? 0) >= 0 ? terminalColors.green : terminalColors.red,
                      }}
                    >
                      {formatCurrency(data?.drawdown.monthly.amount ?? 0)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography
                      sx={{ color: terminalColors.textSecondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}
                    >
                      Available Cash
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, fontFamily: monoFont, color: terminalColors.green }}
                    >
                      {formatCurrency(data?.settledCash ?? 5000)}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
