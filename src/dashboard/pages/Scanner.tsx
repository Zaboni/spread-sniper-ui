import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha } from '@mui/material/styles';
import { useScanner } from '../../hooks/useApi';

// Monospace font for numbers
const monoFont = '"JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace';

// Regime colors with semantic meaning
const regimeConfig: Record<string, {
  color: 'success' | 'warning' | 'error' | 'default';
  bgColor: string;
  borderColor: string;
  textColor: string;
}> = {
  calm_bull: {
    color: 'success',
    bgColor: 'rgba(2, 205, 13, 0.15)',
    borderColor: 'rgba(2, 205, 13, 0.4)',
    textColor: '#02cd0d',
  },
  volatile_bull: {
    color: 'warning',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    textColor: '#f59e0b',
  },
  calm_bear: {
    color: 'warning',
    bgColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
    textColor: '#fbbf24',
  },
  volatile_bear: {
    color: 'error',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    textColor: '#ef4444',
  },
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPercent(value: number): string {
  if (isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value)) return 'N/A';
  return value.toFixed(decimals);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

// Component for displaying spread vs threshold with progress bar
function SpreadThresholdCell({ spread, threshold }: { spread: number; threshold: number | null }) {
  if (threshold === null || isNaN(spread)) {
    return (
      <Typography sx={{ fontFamily: monoFont, fontSize: '0.8125rem' }}>
        {formatPercent(spread)}
      </Typography>
    );
  }

  const ratio = Math.min((spread / threshold) * 100, 100);
  const isNearThreshold = ratio >= 80;
  const isAboveThreshold = spread >= threshold;

  const color = isAboveThreshold
    ? '#02cd0d'
    : isNearThreshold
      ? '#f59e0b'
      : '#64748b';

  return (
    <Box sx={{ minWidth: 100 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography
          sx={{
            fontFamily: monoFont,
            fontSize: '0.8125rem',
            color: isAboveThreshold ? '#02cd0d' : 'inherit',
            fontWeight: isAboveThreshold ? 600 : 400,
          }}
        >
          {formatPercent(spread)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={ratio}
        sx={{
          height: 4,
          borderRadius: 2,
          backgroundColor: alpha('#64748b', 0.2),
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 2,
          },
        }}
      />
    </Box>
  );
}

// Styled table cell for monospace numbers
function MonoCell({ children, align = 'right', positive, negative }: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <TableCell
      align={align}
      sx={{
        fontFamily: monoFont,
        fontSize: '0.8125rem',
        color: positive ? '#02cd0d' : negative ? '#ef4444' : 'inherit',
      }}
    >
      {children}
    </TableCell>
  );
}

export default function Scanner() {
  const { data, loading, error } = useScanner(50);

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Scanner
      </Typography>

      {error && (
        <Box sx={{ mb: 4, p: 2, bgcolor: 'error.main', color: 'error.contrastText', borderRadius: 1 }}>
          <Typography>Error loading data: {error}</Typography>
        </Box>
      )}

      {/* Options Chain Candidates */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Current Options Chain Candidates
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
          ) : data?.candidates && data.candidates.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Expiration</TableCell>
                    <TableCell align="right">Strike</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Bid</TableCell>
                    <TableCell align="right">Ask</TableCell>
                    <TableCell align="right">IV</TableCell>
                    <TableCell align="right">Delta</TableCell>
                    <TableCell align="right">Theta</TableCell>
                    <TableCell align="right">Volume</TableCell>
                    <TableCell align="right">OI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.candidates.map((candidate, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: '#e2e8f0' }}>
                          {candidate.symbol}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontFamily: monoFont, fontSize: '0.8125rem' }}>
                        {candidate.expiration}
                      </TableCell>
                      <MonoCell>{formatCurrency(candidate.strike)}</MonoCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={candidate.optionType?.toUpperCase() || 'N/A'}
                          color={candidate.optionType === 'call' ? 'success' : 'error'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <MonoCell>{formatCurrency(candidate.bid)}</MonoCell>
                      <MonoCell>{formatCurrency(candidate.ask)}</MonoCell>
                      <MonoCell>{formatPercent(candidate.iv)}</MonoCell>
                      <MonoCell>{formatNumber(candidate.delta, 3)}</MonoCell>
                      <MonoCell negative={candidate.theta < 0}>
                        {formatNumber(candidate.theta, 4)}
                      </MonoCell>
                      <MonoCell>{candidate.volume.toLocaleString()}</MonoCell>
                      <MonoCell>{candidate.openInterest.toLocaleString()}</MonoCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">
              No options chain candidates found in the last 24 hours.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Scan History */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Recent Scan History
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Regime</TableCell>
                    <TableCell align="right">Confidence</TableCell>
                    <TableCell align="right">IV-RV Spread</TableCell>
                    <TableCell align="right">Threshold</TableCell>
                    <TableCell align="right">VIX</TableCell>
                    <TableCell align="right">IV Rank</TableCell>
                    <TableCell align="right">SPY Price</TableCell>
                    <TableCell align="center">Setups</TableCell>
                    <TableCell align="center">Trades</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.scans || []).map((scan, index) => {
                    const regime = regimeConfig[scan.regime] || regimeConfig.calm_bull;
                    const hasTradeExecuted = scan.trades_executed > 0;

                    return (
                      <TableRow
                        key={index}
                        sx={{
                          ...(hasTradeExecuted && {
                            backgroundColor: 'rgba(2, 205, 13, 0.06)',
                            '&:hover': {
                              backgroundColor: 'rgba(2, 205, 13, 0.1)',
                            },
                          }),
                        }}
                      >
                        <TableCell>
                          <Typography
                            sx={{
                              fontFamily: monoFont,
                              fontSize: '0.8125rem',
                              color: '#94a3b8',
                            }}
                          >
                            {formatTimestamp(scan.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={scan.regime.replace('_', ' ').toUpperCase()}
                            sx={{
                              backgroundColor: regime.bgColor,
                              borderColor: regime.borderColor,
                              border: '1px solid',
                              '& .MuiChip-label': {
                                color: regime.textColor,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                letterSpacing: '0.02em',
                              },
                            }}
                          />
                        </TableCell>
                        <MonoCell>{formatPercent(scan.regimeConfidence)}</MonoCell>
                        <TableCell align="right">
                          <SpreadThresholdCell
                            spread={scan.iv_rv_spread}
                            threshold={scan.iv_rv_threshold}
                          />
                        </TableCell>
                        <MonoCell>
                          {scan.iv_rv_threshold ? formatPercent(scan.iv_rv_threshold) : 'N/A'}
                        </MonoCell>
                        <MonoCell>{formatNumber(scan.vix)}</MonoCell>
                        <MonoCell>{formatPercent(scan.iv_rank / 100)}</MonoCell>
                        <MonoCell>{formatCurrency(scan.spy_price)}</MonoCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={scan.setups_found}
                            color={scan.setups_found > 0 ? 'primary' : 'default'}
                            sx={{
                              minWidth: 32,
                              '& .MuiChip-label': {
                                fontFamily: monoFont,
                                fontWeight: 600,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={scan.trades_executed}
                            color={scan.trades_executed > 0 ? 'success' : 'default'}
                            sx={{
                              minWidth: 32,
                              '& .MuiChip-label': {
                                fontFamily: monoFont,
                                fontWeight: 600,
                              },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {!loading && (!data?.scans || data.scans.length === 0) && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No scan history available.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
