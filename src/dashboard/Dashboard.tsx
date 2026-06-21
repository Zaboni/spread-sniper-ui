import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { Routes, Route } from 'react-router-dom';
import AppTheme from '../theme/AppTheme';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/Overview';
import Performance from './pages/Performance';
import Scanner from './pages/Scanner';
import Trades from './pages/Trades';
import Risk from './pages/Risk';
import RegimeHistory from './pages/RegimeHistory';
import SignalEngine from './pages/SignalEngine';
import DashboardSettings from './pages/DashboardSettings';
import { sidebarCustomizations } from '../theme/customizations/sidebar';

const themeComponents = {
  ...sidebarCustomizations,
};

export default function Dashboard(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props} themeComponents={themeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="performance" element={<Performance />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="trades" element={<Trades />} />
            <Route path="risk" element={<Risk />} />
            <Route path="regime" element={<RegimeHistory />} />
            <Route path="signal-engine" element={<SignalEngine />} />
            <Route path="settings" element={<DashboardSettings />} />
            <Route path="*" element={<Overview />} />
          </Route>
        </Routes>
      </Box>
    </AppTheme>
  );
}
