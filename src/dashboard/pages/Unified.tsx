import React, { memo } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import { useUnifiedSnapshot, type UnifiedSnapshot } from '../../hooks/useApi';

// =============================================================================
// CONSTANTS (match SignalEngine.tsx terminal styling)
// =============================================================================

const monoFont = '"JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace';

const colors = {
  green: '#02cd0d',
  red: '#ef4444',
  orange: '#f59e0b',
  yellow: '#fbbf24',
  blue: '#3b82f6',
  purple: '#a855f7',
};

// SE regime colors (3-state HMM)
const seRegimeColors: Record<string, string> = {
  low_vol: colors.green,
  high_vol: colors.orange,
  crisis: colors.red,
};

const seRegimeLabels: Record<string, string> = {
  low_vol: 'LOW VOL',
  high_vol: 'HIGH VOL',
  crisis: 'CRISIS',
};

// SS regime colors (4-state classifier)
const ssRegimeColors: Record<string, string> = {
  calm_bull: colors.green,
  volatile_bull: colors.orange,
  calm_bear: colors.yellow,
  volatile_bear: colors.red,
};

const ssRegimeLabels: Record<string, string> = {
  calm_bull: 'CALM BULL',
  volatile_bull: 'VOLATILE BULL',
  calm_bear: 'CALM BEAR',
  volatile_bear: 'VOLATILE BEAR',
};

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// =============================================================================
// SIGNAL ENGINE CONTEXT CARD
// =============================================================================

interface SEContextCardProps {
  data: UnifiedSnapshot['signalEngine'];
}

const SEContextCard = memo(function SEContextCard({ data }: SEContextCardProps) {
  const regime = data.regime;
  const regimeColor = regime ? seRegimeColors[regime.label] || 'text.secondary' : 'text.secondary';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Signal Engine
          </Typography>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.purple }} />
        </Box>

        {/* Regime with quarantine badge */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
            HMM Regime
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: regimeColor }}>
              {regime ? seRegimeLabels[regime.label] || regime.label.toUpperCase() : '--'}
            </Typography>
            {regime?.quarantined && (
              <Tooltip title={regime.quarantineReason} arrow>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 0.5,
                  bgcolor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}>
                  <WarningAmberIcon sx={{ fontSize: 12, color: colors.red }} />
                  <Typography sx={{ fontSize: '0.55rem', color: colors.red, fontWeight: 600, textTransform: 'uppercase' }}>
                    Quarantined
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* VIX + IV-RV */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              VIX
            </Typography>
            <Typography sx={{ fontSize: '1.25rem', fontFamily: monoFont, color: 'text.primary' }}>
              {data.vol.vix?.toFixed(1) ?? '--'}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              IV-RV Spread
            </Typography>
            <Typography sx={{ fontSize: '1.25rem', fontFamily: monoFont, color: 'text.primary' }}>
              {data.vol.ivRvSpread !== null ? `${data.vol.ivRvSpread > 0 ? '+' : ''}${data.vol.ivRvSpread.toFixed(1)}pp` : '--'}
            </Typography>
          </Box>
        </Box>

        {/* FOMC */}
        {data.fomc && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
              Latest FOMC
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: '0.8rem', fontFamily: monoFont, color: 'text.primary' }}>
                {formatDate(data.fomc.eventDate)}
              </Typography>
              <Typography sx={{
                fontSize: '0.85rem',
                fontFamily: monoFont,
                fontWeight: 600,
                color: data.fomc.hawkishScore && data.fomc.hawkishScore > 0.1 ? colors.red :
                       data.fomc.hawkishScore && data.fomc.hawkishScore < -0.1 ? colors.green :
                       'text.secondary',
              }}>
                {data.fomc.hawkishScore !== null ? `${data.fomc.hawkishScore > 0 ? '+' : ''}${data.fomc.hawkishScore.toFixed(2)}` : '--'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Decay Alerts */}
        {data.decayAlerts.length > 0 && (
          <Box sx={{
            p: 1,
            borderRadius: 0.5,
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: `3px solid ${colors.red}`,
          }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: colors.red, textTransform: 'uppercase' }}>
              {data.decayAlerts.length} Active Decay Alert{data.decayAlerts.length > 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

// =============================================================================
// SPREAD SNIPER STATE CARD
// =============================================================================

interface SSStateCardProps {
  data: UnifiedSnapshot['spreadSniper'];
}

const SSStateCard = memo(function SSStateCard({ data }: SSStateCardProps) {
  const regime = data.regime;
  const regimeColor = regime ? ssRegimeColors[regime.label] || 'text.secondary' : 'text.secondary';
  const trading = data.trading;
  const lastClassificationDate = data.lastClassificationTimestamp
    ? formatDateFull(data.lastClassificationTimestamp)
    : null;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Spread Sniper
          </Typography>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.green }} />
        </Box>

        {/* Regime */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
            Regime
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
            {regime ? (
              <>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: regimeColor }}>
                  {ssRegimeLabels[regime.label] || regime.label.toUpperCase()}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', fontFamily: monoFont, color: 'text.secondary' }}>
                  {(regime.confidence * 100).toFixed(0)}%
                </Typography>
              </>
            ) : (
              <Tooltip
                title={lastClassificationDate
                  ? `Spread Sniper does not currently run a daily regime classifier. The most recent classification is from ${lastClassificationDate}.`
                  : 'Spread Sniper does not currently run a daily regime classifier.'
                }
                arrow
              >
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'text.secondary', cursor: 'help' }}>
                  Not running
                </Typography>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* IV-RV */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            IV-RV Spread (ATM IV)
          </Typography>
          <Typography sx={{ fontSize: '1.25rem', fontFamily: monoFont, color: 'text.primary' }}>
            {data.ivRvSpread !== null ? `${data.ivRvSpread > 0 ? '+' : ''}${data.ivRvSpread.toFixed(1)}pp` : '--'}
          </Typography>
        </Box>

        {/* Trading State */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Open Positions
            </Typography>
            <Typography sx={{ fontSize: '1.25rem', fontFamily: monoFont, color: 'text.primary' }}>
              {trading.openPositions}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Account
            </Typography>
            <Typography sx={{ fontSize: '1.25rem', fontFamily: monoFont, color: 'text.primary' }}>
              {formatCurrency(trading.accountValue)}
            </Typography>
          </Box>
        </Box>

        {/* Circuit Breaker Warning */}
        {trading.circuitBreakerActive && (
          <Box sx={{
            mt: 2,
            p: 1,
            borderRadius: 0.5,
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: `3px solid ${colors.red}`,
          }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: colors.red, textTransform: 'uppercase' }}>
              Circuit Breaker Active
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

// =============================================================================
// DISAGREEMENT PANEL (LOAD-BEARING)
// =============================================================================

interface DisagreementPanelProps {
  disagreements: UnifiedSnapshot['disagreements'];
  seRegime: UnifiedSnapshot['signalEngine']['regime'];
  ssRegime: UnifiedSnapshot['spreadSniper']['regime'];
}

const DisagreementPanel = memo(function DisagreementPanel({ disagreements, seRegime, ssRegime }: DisagreementPanelProps) {
  const seColor = seRegime ? seRegimeColors[seRegime.label] || 'text.secondary' : 'text.secondary';
  const ssColor = ssRegime ? ssRegimeColors[ssRegime.label] || 'text.secondary' : 'text.secondary';

  return (
    <Card sx={{}}>
      <CardContent>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 3 }}>
          Disagreements
        </Typography>

        {/* Regime Disagreement */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
            Regime Classification
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr' }, gap: 2, alignItems: 'center' }}>
            {/* SE Side */}
            <Box sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'rgba(168, 85, 247, 0.08)',
              border: `1px solid rgba(168, 85, 247, 0.2)`,
            }}>
              <Typography sx={{ fontSize: '0.6rem', color: colors.purple, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                Signal Engine (HMM)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: seColor }}>
                  {seRegime ? seRegimeLabels[seRegime.label] || seRegime.label.toUpperCase() : '--'}
                </Typography>
                {disagreements.regime.seQuarantined && (
                  <Tooltip title={disagreements.regime.quarantineReason} arrow>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.3,
                      px: 0.75,
                      py: 0.2,
                      borderRadius: 0.5,
                      bgcolor: 'rgba(239, 68, 68, 0.15)',
                    }}>
                      <WarningAmberIcon sx={{ fontSize: 10, color: colors.red }} />
                      <Typography sx={{ fontSize: '0.5rem', color: colors.red, fontWeight: 600 }}>
                        QUARANTINED
                      </Typography>
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* VS */}
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
              vs
            </Typography>

            {/* SS Side */}
            <Box sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'rgba(2, 205, 13, 0.08)',
              border: `1px solid rgba(2, 205, 13, 0.2)`,
            }}>
              <Typography sx={{ fontSize: '0.6rem', color: colors.green, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                Spread Sniper
              </Typography>
              <Typography sx={{ fontSize: ssRegime ? '1.25rem' : '0.9rem', fontWeight: ssRegime ? 700 : 500, color: ssColor, fontStyle: ssRegime ? 'normal' : 'italic' }}>
                {ssRegime ? ssRegimeLabels[ssRegime.label] || ssRegime.label.toUpperCase() : '(no recent SS classification)'}
              </Typography>
            </Box>
          </Box>

          {/* Quarantine Warning */}
          <Box sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 0.5,
            bgcolor: 'rgba(245, 158, 11, 0.08)',
            border: `1px solid rgba(245, 158, 11, 0.2)`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <WarningAmberIcon sx={{ fontSize: 14, color: colors.orange, mt: 0.2 }} />
              <Typography sx={{ fontSize: '0.7rem', color: colors.orange, lineHeight: 1.4 }}>
                HMM regime is quarantined due to sticky-crisis bug. P(crisis→low_vol)=0% in transition matrix.
                Do not use for trading decisions.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* IV-RV Disagreement */}
        <Box>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
            IV-RV Spread Comparison
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            {/* SE Value */}
            <Box sx={{ p: 1.5, borderRadius: 0.5, bgcolor: 'rgba(148, 163, 184, 0.05)' }}>
              <Typography sx={{ fontSize: '0.55rem', color: colors.purple, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SE (VIX-based)
              </Typography>
              <Typography sx={{ fontSize: '1.1rem', fontFamily: monoFont, color: 'text.primary' }}>
                {disagreements.ivRv.seValue !== null ? `${disagreements.ivRv.seValue > 0 ? '+' : ''}${disagreements.ivRv.seValue.toFixed(2)}pp` : '--'}
              </Typography>
            </Box>

            {/* SS Value */}
            <Box sx={{ p: 1.5, borderRadius: 0.5, bgcolor: 'rgba(148, 163, 184, 0.05)' }}>
              <Typography sx={{ fontSize: '0.55rem', color: colors.green, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SS (ATM IV-based)
              </Typography>
              <Typography sx={{ fontSize: '1.1rem', fontFamily: monoFont, color: 'text.primary' }}>
                {disagreements.ivRv.ssValue !== null ? `${disagreements.ivRv.ssValue > 0 ? '+' : ''}${disagreements.ivRv.ssValue.toFixed(2)}pp` : '--'}
              </Typography>
            </Box>

            {/* Divergence (no judgment label per Phase 3 finding) */}
            <Box sx={{ p: 1.5, borderRadius: 0.5, bgcolor: 'rgba(148, 163, 184, 0.05)' }}>
              <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Divergence
              </Typography>
              <Typography sx={{ fontSize: '1.1rem', fontFamily: monoFont, color: 'text.primary' }}>
                {disagreements.ivRv.divergence !== null ? `${disagreements.ivRv.divergence.toFixed(2)}pp` : '--'}
              </Typography>
            </Box>
          </Box>

          {/* Methodology Note */}
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 1.5, fontStyle: 'italic' }}>
            {disagreements.ivRv.methodologyNote}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
});

// =============================================================================
// PHASE 3 RULES PANEL
// =============================================================================

interface Phase3RulesPanelProps {
  rules: UnifiedSnapshot['phase3Rules'];
}

const Phase3RulesPanel = memo(function Phase3RulesPanel({ rules }: Phase3RulesPanelProps) {
  return (
    <Card sx={{}}>
      <CardContent>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
          Phase 3 Integration Rules
        </Typography>

        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) 100px 120px 110px minmax(200px, 2fr)', gap: 0, minWidth: 730 }}>
            {/* Header */}
            {['Rule', 'Current', 'Threshold', 'Status', 'Reason'].map((h) => (
              <Typography key={h} sx={{
                fontSize: '0.55rem',
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                py: 1,
                px: 1,
                borderBottom: '1px solid', borderColor: 'divider',
                fontWeight: 600,
              }}>
                {h}
              </Typography>
            ))}

            {/* Rows */}
            {rules.map((rule) => (
              <React.Fragment key={rule.name}>
                <Box sx={{ py: 1.5, px: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: '0.75rem', fontFamily: monoFont, color: 'text.primary' }}>
                    {rule.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                    {rule.action}
                  </Typography>
                </Box>
                <Typography sx={{
                  fontSize: '0.75rem',
                  fontFamily: monoFont,
                  color: 'text.primary',
                  py: 1.5,
                  px: 1,
                  borderBottom: '1px solid', borderColor: 'divider',
                }}>
                  {rule.currentValue}
                </Typography>
                <Typography sx={{
                  fontSize: '0.7rem',
                  fontFamily: monoFont,
                  color: 'text.secondary',
                  py: 1.5,
                  px: 1,
                  borderBottom: '1px solid', borderColor: 'divider',
                }}>
                  {rule.threshold}
                </Typography>
                <Box sx={{ py: 1.5, px: 1, borderBottom: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  <Box sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    bgcolor: rule.enabled
                      ? 'rgba(2, 205, 13, 0.15)'
                      : rule.status === 'FAIL'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(148, 163, 184, 0.15)',
                  }}>
                    {rule.enabled ? (
                      <CheckCircleOutlineIcon sx={{ fontSize: 10, color: colors.green, flexShrink: 0 }} />
                    ) : (
                      <BlockIcon sx={{ fontSize: 10, color: rule.status === 'FAIL' ? colors.red : 'text.secondary', flexShrink: 0 }} />
                    )}
                    <Typography sx={{
                      fontSize: '0.55rem',
                      fontWeight: 600,
                      color: rule.enabled ? colors.green : rule.status === 'FAIL' ? colors.red : 'text.secondary',
                      whiteSpace: 'nowrap',
                    }}>
                      {rule.status}
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{
                  fontSize: '0.65rem',
                  color: 'text.secondary',
                  py: 1.5,
                  px: 1,
                  borderBottom: '1px solid', borderColor: 'divider',
                  lineHeight: 1.4,
                }}>
                  {rule.reason}
                </Typography>
              </React.Fragment>
            ))}
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 2, fontStyle: 'italic' }}>
          All rules disabled per Phase 3 backtest results. See spread-sniper/docs/SIGNAL_ENGINE_INTEGRATION_PROTOCOL.md
        </Typography>
      </CardContent>
    </Card>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Unified() {
  const { data, loading, error, lastUpdated } = useUnifiedSnapshot(60000);

  if (loading && !data) {
    return (
      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
        <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Unified View</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {error && (
            <Typography sx={{ fontSize: '0.7rem', color: colors.red }}>
              Error: {error}
            </Typography>
          )}
          {lastUpdated && (
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontFamily: monoFont }}>
              Updated {formatTime(lastUpdated.toISOString())}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Two Column Layout: SE + SS */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <SEContextCard data={data?.signalEngine || {
          regime: null,
          vol: { vix: null, rv: null, ivRvSpread: null, methodology: '' },
          fomc: null,
          news: [],
          decayAlerts: [],
          prediction: null,
        }} />
        <SSStateCard data={data?.spreadSniper || {
          regime: null,
          lastClassificationTimestamp: null,
          ivRvSpread: null,
          ivRvMethodology: '',
          trading: {
            openPositions: 0,
            accountValue: 5000,
            exposure: 0,
            exposurePercent: 0,
            weeklyPnL: 0,
            weeklyDrawdownPercent: 0,
            circuitBreakerActive: false,
          },
        }} />
      </Box>

      {/* Disagreement Panel */}
      <Box sx={{ mb: 3 }}>
        <DisagreementPanel
          disagreements={data?.disagreements || {
            regime: { disagrees: null, seLabel: null, ssLabel: null, seQuarantined: true, quarantineReason: '' },
            ivRv: { seValue: null, ssValue: null, divergence: null, methodologyNote: '' },
          }}
          seRegime={data?.signalEngine.regime || null}
          ssRegime={data?.spreadSniper.regime || null}
        />
      </Box>

      {/* Phase 3 Rules */}
      <Phase3RulesPanel rules={data?.phase3Rules || []} />
    </Container>
  );
}
