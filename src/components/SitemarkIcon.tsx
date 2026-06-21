import SvgIcon from '@mui/material/SvgIcon';

export default function SitemarkIcon() {
  return (
    <SvgIcon sx={{ height: 28, width: 28 }}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle */}
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="#02cd0d"
          strokeWidth="2"
          fill="none"
        />
        {/* Inner circle */}
        <circle
          cx="12"
          cy="12"
          r="4"
          stroke="#02cd0d"
          strokeWidth="2"
          fill="none"
        />
        {/* Center dot */}
        <circle cx="12" cy="12" r="1.5" fill="#02cd0d" />
        {/* Crosshair lines */}
        <line
          x1="12"
          y1="1"
          x2="12"
          y2="5"
          stroke="#02cd0d"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="19"
          x2="12"
          y2="23"
          stroke="#02cd0d"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="1"
          y1="12"
          x2="5"
          y2="12"
          stroke="#02cd0d"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="19"
          y1="12"
          x2="23"
          y2="12"
          stroke="#02cd0d"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </SvgIcon>
  );
}
