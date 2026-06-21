import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

export default function DashboardSettings() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Settings
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Notifications
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Email notifications"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Push notifications"
            />
            <FormControlLabel
              control={<Switch />}
              label="SMS notifications"
            />
          </Box>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Privacy
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Show profile publicly"
            />
            <FormControlLabel
              control={<Switch />}
              label="Share usage data"
            />
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
