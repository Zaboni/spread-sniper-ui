import { useState, useMemo } from 'react';
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
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import TablePagination from '@mui/material/TablePagination';
import { useTrades } from '../../hooks/useApi';

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

const statusConfig: Record<string, {
  bgColor: string;
  borderColor: string;
  textColor: string;
}> = {
  open: {
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    textColor: '#3b82f6',
  },
  closed: {
    bgColor: 'rgba(2, 205, 13, 0.15)',
    borderColor: 'rgba(2, 205, 13, 0.4)',
    textColor: '#02cd0d',
  },
  expired: {
    bgColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: 'rgba(100, 116, 139, 0.4)',
    textColor: '#94a3b8',
  },
};

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

type SortDirection = 'asc' | 'desc';
type SortColumn = 'entryTime' | 'symbol' | 'strategy' | 'pnl' | 'status';

export default function Trades() {
  const [filters, setFilters] = useState({
    strategy: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<SortColumn>('entryTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const apiFilters = useMemo(() => ({
    strategy: filters.strategy || undefined,
    status: filters.status || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    limit: rowsPerPage,
    offset: page * rowsPerPage,
  }), [filters, page, rowsPerPage]);

  const { data, loading, error } = useTrades(apiFilters);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedTrades = useMemo(() => {
    if (!data?.trades) return [];
    return [...data.trades].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'entryTime':
          comparison = new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime();
          break;
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'strategy':
          comparison = (a.strategy || '').localeCompare(b.strategy || '');
          break;
        case 'pnl':
          comparison = a.pnl - b.pnl;
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.trades, sortColumn, sortDirection]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (key: keyof typeof filters) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilters(prev => ({ ...prev, [key]: event.target.value }));
    setPage(0);
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Trade Journal
      </Typography>

      {error && (
        <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 1 }}>
          <Typography sx={{ color: '#ef4444' }}>Error loading data: {error}</Typography>
        </Box>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="subtitle2"
            sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', color: '#94a3b8' }}
          >
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Strategy"
                value={filters.strategy}
                onChange={handleFilterChange('strategy')}
              >
                <MenuItem value="">All Strategies</MenuItem>
                {(data?.filters?.strategies || []).map((strategy) => (
                  <MenuItem key={strategy} value={strategy}>
                    {strategy}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={filters.status}
                onChange={handleFilterChange('status')}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {(data?.filters?.statuses || []).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange('startDate')}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange('endDate')}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'entryTime'}
                          direction={sortColumn === 'entryTime' ? sortDirection : 'asc'}
                          onClick={() => handleSort('entryTime')}
                        >
                          Entry Time
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'symbol'}
                          direction={sortColumn === 'symbol' ? sortDirection : 'asc'}
                          onClick={() => handleSort('symbol')}
                        >
                          Symbol
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'strategy'}
                          direction={sortColumn === 'strategy' ? sortDirection : 'asc'}
                          onClick={() => handleSort('strategy')}
                        >
                          Strategy
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Regime</TableCell>
                      <TableCell align="right">Entry Price</TableCell>
                      <TableCell align="right">Exit Price</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortColumn === 'pnl'}
                          direction={sortColumn === 'pnl' ? sortDirection : 'asc'}
                          onClick={() => handleSort('pnl')}
                        >
                          P&L
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'status'}
                          direction={sortColumn === 'status' ? sortDirection : 'asc'}
                          onClick={() => handleSort('status')}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Exit Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedTrades.map((trade) => {
                      const regime = regimeConfig[trade.regime] || regimeConfig.calm_bull;
                      const status = statusConfig[trade.status] || statusConfig.expired;
                      const isPnlPositive = trade.pnl >= 0;

                      return (
                        <TableRow
                          key={trade.id}
                          sx={{
                            ...(isPnlPositive && trade.status === 'closed' && {
                              backgroundColor: 'rgba(2, 205, 13, 0.04)',
                            }),
                            ...(!isPnlPositive && trade.status === 'closed' && {
                              backgroundColor: 'rgba(239, 68, 68, 0.04)',
                            }),
                          }}
                        >
                          <TableCell>
                            <Typography
                              sx={{ fontFamily: monoFont, fontSize: '0.8125rem', color: '#94a3b8' }}
                            >
                              {formatTimestamp(trade.entryTime)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, color: '#e2e8f0' }}>
                              {trade.symbol}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.8125rem' }}>
                              {trade.strategy || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {trade.regime && (
                              <Chip
                                size="small"
                                label={trade.regime.replace('_', ' ').toUpperCase()}
                                sx={{
                                  backgroundColor: regime.bgColor,
                                  borderColor: regime.borderColor,
                                  border: '1px solid',
                                  '& .MuiChip-label': {
                                    color: regime.textColor,
                                    fontWeight: 600,
                                    fontSize: '0.65rem',
                                    letterSpacing: '0.02em',
                                  },
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontFamily: monoFont, fontSize: '0.8125rem' }}>
                              {formatCurrency(trade.entryPrice)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontFamily: monoFont, fontSize: '0.8125rem' }}>
                              {trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontFamily: monoFont, fontSize: '0.8125rem' }}>
                              {trade.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              sx={{
                                fontFamily: monoFont,
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: isPnlPositive ? '#02cd0d' : '#ef4444',
                              }}
                            >
                              {formatCurrency(trade.pnl)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={trade.status.toUpperCase()}
                              sx={{
                                backgroundColor: status.bgColor,
                                borderColor: status.borderColor,
                                border: '1px solid',
                                '& .MuiChip-label': {
                                  color: status.textColor,
                                  fontWeight: 600,
                                  fontSize: '0.65rem',
                                  letterSpacing: '0.02em',
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{ fontFamily: monoFont, fontSize: '0.8125rem', color: '#94a3b8' }}
                            >
                              {formatTimestamp(trade.exitTime)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={data?.pagination?.total || 0}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100]}
                sx={{
                  '& .MuiTablePagination-displayedRows': {
                    fontFamily: monoFont,
                    fontSize: '0.8125rem',
                  },
                  '& .MuiTablePagination-selectLabel': {
                    fontSize: '0.8125rem',
                  },
                }}
              />
            </>
          )}
          {!loading && sortedTrades.length === 0 && (
            <Typography color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              No trades found matching your filters.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
