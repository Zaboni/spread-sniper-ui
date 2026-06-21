import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function DashboardReports() {
  const { reportType } = useParams();

  const reportTitle = reportType
    ? reportType.charAt(0).toUpperCase() + reportType.slice(1)
    : 'All';

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        {reportTitle} Reports
      </Typography>
      <Card>
        <CardContent>
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              {reportType
                ? `${reportTitle} report data will be displayed here.`
                : 'Select a report type from the sidebar to view detailed analytics.'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
