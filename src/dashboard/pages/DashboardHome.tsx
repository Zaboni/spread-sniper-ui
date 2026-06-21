import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';

const stats = [
  {
    title: 'Total Revenue',
    value: '$45,231',
    change: '+12.5%',
    icon: <AttachMoneyIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Active Users',
    value: '2,345',
    change: '+8.2%',
    icon: <PeopleIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Sales',
    value: '1,234',
    change: '+15.3%',
    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Products',
    value: '567',
    change: '+3.1%',
    icon: <InventoryIcon sx={{ fontSize: 40 }} />,
  },
];

export default function DashboardHome() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'success.main', mt: 1 }}
                    >
                      {stat.change} from last month
                    </Typography>
                  </Box>
                  <Box sx={{ color: 'primary.main' }}>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Welcome to your dashboard
        </Typography>
        <Typography color="text.secondary">
          This is your personalized dashboard where you can view your analytics,
          manage your settings, and access all your important data. Use the
          sidebar navigation to explore different sections.
        </Typography>
      </Box>
    </Container>
  );
}
