import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SpeedIcon from '@mui/icons-material/Speed';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useOverview } from '../../hooks/useApi';

// Monospace font for numbers
const monoFont = '"JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace';

// Regime colors with semantic meaning
const regimeConfig: Record<string, {
  bgColor: string;
  borderColor: string;
  textColor: string;
}> = {
  calm_bull: {
    bgColor: 'rgba(2, 205, 13, 0.15)',
    borderColor: 'rgba(2, 205, 13, 0.4)',
    textColor: '#02cd0d',
  },
  volatile_bull: {
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    textColor: '#f59e0b',
  },
  calm_bear: {
    bgColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
    textColor: '#fbbf24',
  },
  volatile_bear: {
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    textColor: '#ef4444',
  },
};

const regimeLabels: Record<string, string> = {
  calm_bull: 'CALM BULL',
  volatile_bull: 'VOLATILE BULL',
  calm_bear: 'CALM BEAR',
  volatile_bear: 'VOLATILE BEAR',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  positive?: boolean;
  negative?: boolean;
  loading?: boolean;
}

function StatCard({ title, value, icon, subtitle, positive, negative, loading }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}
            >
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={120} height={40} />
            ) : (
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  fontFamily: monoFont,
                  color: positive ? '#02cd0d' : negative ? '#ef4444' : '#e2e8f0',
                }}
              >
                {value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: '#02cd0d', opacity: 0.6 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Overview() {
  const { data, loading, error } = useOverview();

  const isPnlPositive = (data?.todayPnL ?? 0) >= 0;

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Overview</Typography>
        {data && (
          <Chip
            icon={data.shouldTrade ? <PlayArrowIcon /> : <PauseIcon />}
            label={data.shouldTrade ? 'TRADING ACTIVE' : 'SITTING OUT'}
            sx={{
              backgroundColor: data.shouldTrade ? 'rgba(2, 205, 13, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              borderColor: data.shouldTrade ? 'rgba(2, 205, 13, 0.4)' : 'rgba(100, 116, 139, 0.4)',
              border: '1px solid',
              '& .MuiChip-label': {
                color: data.shouldTrade ? '#02cd0d' : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: '0.02em',
              },
              '& .MuiChip-icon': {
                color: data.shouldTrade ? '#02cd0d' : '#94a3b8',
              },
            }}
          />
        )}
      </Box>

      {error && (
        <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 1 }}>
          <Typography sx={{ color: '#ef4444' }}>Error loading data: {error}</Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Account Value */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Account Value"
            value={loading ? '' : formatCurrency(data?.accountValue ?? 5000)}
            icon={<AccountBalanceWalletIcon sx={{ fontSize: 40 }} />}
            subtitle="Simulated account"
            loading={loading}
          />
        </Grid>

        {/* Today's P&L */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Today's P&L"
            value={loading ? '' : formatCurrency(data?.todayPnL ?? 0)}
            icon={isPnlPositive ?
              <TrendingUpIcon sx={{ fontSize: 40 }} /> :
              <TrendingDownIcon sx={{ fontSize: 40 }} />
            }
            positive={isPnlPositive && !loading}
            negative={!isPnlPositive && !loading}
            loading={loading}
          />
        </Grid>

        {/* Current Regime */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}
                  >
                    Current Regime
                  </Typography>
                  {loading ? (
                    <Skeleton variant="rounded" width={120} height={32} />
                  ) : (
                    <Chip
                      label={regimeLabels[data?.regime ?? ''] || data?.regime?.toUpperCase() || 'UNKNOWN'}
                      sx={{
                        backgroundColor: regimeConfig[data?.regime ?? '']?.bgColor || 'rgba(100, 116, 139, 0.15)',
                        borderColor: regimeConfig[data?.regime ?? '']?.borderColor || 'rgba(100, 116, 139, 0.4)',
                        border: '1px solid',
                        '& .MuiChip-label': {
                          color: regimeConfig[data?.regime ?? '']?.textColor || '#94a3b8',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          letterSpacing: '0.02em',
                        },
                      }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ mt: 1.5, fontFamily: monoFont, color: '#94a3b8' }}
                  >
                    Confidence: {loading ? '...' : formatPercent(data?.regimeConfidence ?? 0)}
                  </Typography>
                </Box>
                <Box sx={{ color: '#02cd0d', opacity: 0.6 }}>
                  <ShowChartIcon sx={{ fontSize: 40 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* VIX Level */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="VIX Level"
            value={loading ? '' : (data?.vix ?? 0).toFixed(2)}
            icon={<SpeedIcon sx={{ fontSize: 40 }} />}
            subtitle="Volatility Index"
            loading={loading}
          />
        </Grid>

        {/* IV-RV Spread */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="IV-RV Spread"
            value={loading ? '' : formatPercent(data?.ivRvSpread ?? 0)}
            icon={<ShowChartIcon sx={{ fontSize: 40 }} />}
            subtitle="Implied vs Realized"
            loading={loading}
          />
        </Grid>

        {/* Open Positions */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Open Positions"
            value={loading ? '' : String(data?.openPositions ?? 0)}
            icon={<FolderOpenIcon sx={{ fontSize: 40 }} />}
            subtitle="Active trades"
            loading={loading}
          />
        </Grid>

        {/* Last Scan */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Last Scan"
            value={loading ? '' : formatTimestamp(data?.lastScanTimestamp ?? null)}
            icon={<AccessTimeIcon sx={{ fontSize: 40 }} />}
            subtitle={`SPY: ${loading ? '...' : formatCurrency(data?.spyPrice ?? 0)}`}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Market Status Summary */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Market Status
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography color="text.secondary" sx={{ minWidth: 140, fontSize: '0.875rem' }}>Regime:</Typography>
                {loading ? (
                  <Skeleton width={100} />
                ) : (
                  <Chip
                    size="small"
                    label={regimeLabels[data?.regime ?? ''] || data?.regime?.toUpperCase() || 'UNKNOWN'}
                    sx={{
                      backgroundColor: regimeConfig[data?.regime ?? '']?.bgColor || 'rgba(100, 116, 139, 0.15)',
                      borderColor: regimeConfig[data?.regime ?? '']?.borderColor || 'rgba(100, 116, 139, 0.4)',
                      border: '1px solid',
                      '& .MuiChip-label': {
                        color: regimeConfig[data?.regime ?? '']?.textColor || '#94a3b8',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      },
                    }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography color="text.secondary" sx={{ minWidth: 140, fontSize: '0.875rem' }}>Confidence:</Typography>
                <Typography sx={{ fontFamily: monoFont }}>{loading ? '...' : formatPercent(data?.regimeConfidence ?? 0)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography color="text.secondary" sx={{ minWidth: 140, fontSize: '0.875rem' }}>VIX:</Typography>
                <Typography sx={{ fontFamily: monoFont }}>{loading ? '...' : (data?.vix ?? 0).toFixed(2)}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography color="text.secondary" sx={{ minWidth: 140, fontSize: '0.875rem' }}>IV-RV Spread:</Typography>
                <Typography sx={{ fontFamily: monoFont }}>{loading ? '...' : formatPercent(data?.ivRvSpread ?? 0)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography color="text.secondary" sx={{ minWidth: 140, fontSize: '0.875rem' }}>Trading Signal:</Typography>
                {loading ? (
                  <Skeleton width={80} />
                ) : (
                  <Chip
                    size="small"
                    label={data?.shouldTrade ? 'TRADE' : 'SIT OUT'}
                    sx={{
                      backgroundColor: data?.shouldTrade ? 'rgba(2, 205, 13, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                      borderColor: data?.shouldTrade ? 'rgba(2, 205, 13, 0.4)' : 'rgba(100, 116, 139, 0.4)',
                      border: '1px solid',
                      '& .MuiChip-label': {
                        color: data?.shouldTrade ? '#02cd0d' : '#94a3b8',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      },
                    }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography color="text.secondary" sx={{ minWidth: 140, fontSize: '0.875rem' }}>SPY Price:</Typography>
                <Typography sx={{ fontFamily: monoFont }}>{loading ? '...' : formatCurrency(data?.spyPrice ?? 0)}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}
