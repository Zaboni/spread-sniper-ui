import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const logos = [
  'https://mui.com/static/branding/companies/light/airbnb.svg',
  'https://mui.com/static/branding/companies/light/netflix.svg',
  'https://mui.com/static/branding/companies/light/pinterest.svg',
  'https://mui.com/static/branding/companies/light/spotify.svg',
  'https://mui.com/static/branding/companies/light/uber.svg',
];

const logoStyle = {
  width: '100px',
  height: '80px',
  margin: '0 32px',
  opacity: 0.7,
};

export default function LogoCollection() {
  return (
    <Box id="logoCollection" sx={{ py: 4 }}>
      <Typography
        component="p"
        variant="subtitle2"
        align="center"
        sx={{ color: 'text.secondary' }}
      >
        Trusted by the best companies
      </Typography>
      <Box
        sx={(theme) => ({
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 0.5,
          mt: 0.5,
          '& img': {
            ...logoStyle,
          },
          ...theme.applyStyles('dark', {
            '& img': {
              filter: 'invert(1)',
            },
          }),
        })}
      >
        {logos.map((logo, index) => (
          <img
            key={index}
            src={logo}
            alt={`Company logo ${index + 1}`}
            style={logoStyle}
          />
        ))}
      </Box>
    </Box>
  );
}
