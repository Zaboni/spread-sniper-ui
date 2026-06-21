import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';

const userTestimonials = [
  {
    avatar: <Avatar alt="Remy Sharp" src="https://mui.com/static/images/avatar/1.jpg" />,
    name: 'Remy Sharp',
    occupation: 'Senior Engineer',
    testimonial:
      "I absolutely love how versatile this product is! Whether I'm tackling work projects or indulging in my favorite hobbies, it seamlessly adapts to my needs. Its intuitive design has truly enhanced my #702experience.",
  },
  {
    avatar: <Avatar alt="Travis Howard" src="https://mui.com/static/images/avatar/2.jpg" />,
    name: 'Travis Howard',
    occupation: 'Lead Product Designer',
    testimonial:
      "One of the standout features of this product is the exceptional customer support. In my experience, the weights are always responsive and attentive, addressing any issues you may have promptly.",
  },
  {
    avatar: <Avatar alt="Cindy Baker" src="https://mui.com/static/images/avatar/3.jpg" />,
    name: 'Cindy Baker',
    occupation: 'CTO',
    testimonial:
      'The level of simplicity and user-friendliness in this product has significantly simplified my life. I appreciate the thought and care that went into creating such an intuitive experience.',
  },
  {
    avatar: <Avatar alt="Julia Stewart" src="https://mui.com/static/images/avatar/4.jpg" />,
    name: 'Julia Stewart',
    occupation: 'Senior Engineer',
    testimonial:
      "I appreciate the attention to detail in the design of this product. The small things make a big difference, and it's evident that the creators put a lot of thought into every aspect.",
  },
  {
    avatar: <Avatar alt="John Smith" src="https://mui.com/static/images/avatar/5.jpg" />,
    name: 'John Smith',
    occupation: 'Product Designer',
    testimonial:
      "I've tried other similar products, but this one stands out for its innovative features. It has exceeded my expectations in every way.",
  },
  {
    avatar: <Avatar alt="Daniel Wolf" src="https://mui.com/static/images/avatar/6.jpg" />,
    name: 'Daniel Wolf',
    occupation: 'CDO',
    testimonial:
      "The quality of this product is unmatched. It's durable, reliable, and worth every penny spent. I'm impressed with the craftsmanship.",
  },
];

const whiteLogos = [
  'https://mui.com/static/branding/companies/dark/airbnb.svg',
  'https://mui.com/static/branding/companies/dark/netflix.svg',
  'https://mui.com/static/branding/companies/dark/pinterest.svg',
  'https://mui.com/static/branding/companies/dark/spotify.svg',
  'https://mui.com/static/branding/companies/dark/uber.svg',
  'https://mui.com/static/branding/companies/dark/amazon.svg',
];

const darkLogos = [
  'https://mui.com/static/branding/companies/light/airbnb.svg',
  'https://mui.com/static/branding/companies/light/netflix.svg',
  'https://mui.com/static/branding/companies/light/pinterest.svg',
  'https://mui.com/static/branding/companies/light/spotify.svg',
  'https://mui.com/static/branding/companies/light/uber.svg',
  'https://mui.com/static/branding/companies/light/amazon.svg',
];

const logoStyle = {
  width: '64px',
  opacity: 0.3,
};

export default function Testimonials() {
  const theme = useTheme();
  const logos = theme.palette.mode === 'light' ? darkLogos : whiteLogos;

  return (
    <Container
      id="testimonials"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 3, sm: 6 },
      }}
    >
      <Box
        sx={{
          width: { sm: '100%', md: '60%' },
          textAlign: { sm: 'left', md: 'center' },
        }}
      >
        <Typography
          component="h2"
          variant="h4"
          gutterBottom
          sx={{ color: 'text.primary' }}
        >
          Testimonials
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          See what our customers love about our products. Discover how we excel in
          efficiency, durability, and satisfaction. Join us for quality, innovation,
          and reliable support.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {userTestimonials.map((testimonial, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: 'flex' }}>
            <Card
              variant="outlined"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flexGrow: 1,
              }}
            >
              <CardContent>
                <Typography
                  variant="body1"
                  gutterBottom
                  sx={{ color: 'text.secondary' }}
                >
                  {testimonial.testimonial}
                </Typography>
              </CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <CardHeader
                  avatar={testimonial.avatar}
                  title={testimonial.name}
                  subheader={testimonial.occupation}
                />
                <img
                  src={logos[index]}
                  alt={`Logo ${index + 1}`}
                  style={logoStyle}
                />
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
