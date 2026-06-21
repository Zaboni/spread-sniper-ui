import { createTheme, alpha } from '@mui/material/styles';
import type { PaletteMode, Shadows } from '@mui/material/styles';

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    highlighted: true;
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    mono: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    mono?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    mono: true;
  }
}

const defaultTheme = createTheme();

const customShadows: Shadows = [...defaultTheme.shadows];
// Add subtle dark mode shadows
customShadows[1] = '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)';
customShadows[2] = '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)';
customShadows[3] = '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)';

// Terminal-style colors
// Background: #0a0e17 (deep dark blue-black)
// Card surfaces: #1a1f2e (subtle card background)
// Green accent: #02cd0d (brand green)
// Red: #ef4444 (negative values)
// Primary text: #e2e8f0 (light gray)
// Secondary text: #94a3b8 (muted gray)

export const brand = {
  50: 'hsl(123, 90%, 95%)',
  100: 'hsl(123, 85%, 88%)',
  200: 'hsl(123, 80%, 75%)',
  300: 'hsl(123, 85%, 60%)',
  400: '#02cd0d',  // Main brand green
  500: 'hsl(123, 98%, 35%)',
  600: 'hsl(123, 95%, 45%)',
  700: 'hsl(123, 100%, 28%)',
  800: 'hsl(123, 100%, 15%)',
  900: 'hsl(123, 100%, 10%)',
};

// Terminal gray palette
export const gray = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',  // Primary text in dark mode
  300: '#cbd5e1',
  400: '#94a3b8',  // Secondary text in dark mode
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1a1f2e',  // Card surfaces
  900: '#0a0e17',  // Main background
};

export const green = {
  50: 'hsl(120, 80%, 98%)',
  100: 'hsl(120, 75%, 94%)',
  200: 'hsl(120, 75%, 87%)',
  300: '#02cd0d',
  400: '#02cd0d',
  500: 'hsl(120, 59%, 30%)',
  600: 'hsl(120, 70%, 25%)',
  700: 'hsl(120, 75%, 16%)',
  800: 'hsl(120, 84%, 10%)',
  900: 'hsl(120, 87%, 6%)',
};

export const orange = {
  50: 'hsl(45, 100%, 97%)',
  100: 'hsl(45, 92%, 90%)',
  200: 'hsl(45, 94%, 80%)',
  300: '#f59e0b',  // Warning/volatile bull
  400: '#f59e0b',
  500: 'hsl(45, 90%, 35%)',
  600: 'hsl(45, 91%, 25%)',
  700: 'hsl(45, 94%, 20%)',
  800: 'hsl(45, 95%, 16%)',
  900: 'hsl(45, 93%, 12%)',
};

export const red = {
  50: 'hsl(0, 100%, 97%)',
  100: 'hsl(0, 92%, 90%)',
  200: '#fca5a5',
  300: '#f87171',
  400: '#ef4444',  // Main red for negative values
  500: '#dc2626',
  600: '#b91c1c',
  700: '#991b1b',
  800: '#7f1d1d',
  900: '#450a0a',
};

// Yellow for calm_bear regime
export const yellow = {
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
};

export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    primary: {
      light: brand[200],
      main: brand[400],
      dark: brand[700],
      contrastText: brand[50],
      ...(mode === 'dark' && {
        contrastText: gray[900],
        light: brand[300],
        main: brand[400],
        dark: brand[700],
      }),
    },
    info: {
      light: brand[100],
      main: brand[300],
      dark: brand[600],
      contrastText: gray[50],
      ...(mode === 'dark' && {
        contrastText: brand[300],
        light: brand[500],
        main: brand[700],
        dark: brand[900],
      }),
    },
    warning: {
      light: orange[300],
      main: orange[400],
      dark: orange[800],
      ...(mode === 'dark' && {
        light: orange[300],
        main: orange[400],
        dark: orange[700],
      }),
    },
    error: {
      light: red[300],
      main: red[400],
      dark: red[800],
      ...(mode === 'dark' && {
        light: red[300],
        main: red[400],
        dark: red[700],
      }),
    },
    success: {
      light: green[300],
      main: green[400],
      dark: green[800],
      ...(mode === 'dark' && {
        light: green[300],
        main: green[400],
        dark: green[700],
      }),
    },
    grey: {
      ...gray,
    },
    divider: mode === 'dark' ? alpha(gray[600], 0.3) : alpha(gray[300], 0.4),
    background: {
      default: 'hsl(0, 0%, 99%)',
      paper: 'hsl(220, 35%, 97%)',
      ...(mode === 'dark' && {
        default: gray[900],  // #0a0e17
        paper: gray[800],    // #1a1f2e
      }),
    },
    text: {
      primary: gray[800],
      secondary: gray[600],
      warning: orange[400],
      ...(mode === 'dark' && {
        primary: gray[200],    // #e2e8f0
        secondary: gray[400],  // #94a3b8
      }),
    },
    action: {
      hover: alpha(gray[200], 0.2),
      selected: alpha(gray[200], 0.3),
      ...(mode === 'dark' && {
        hover: alpha(gray[600], 0.2),
        selected: alpha(brand[400], 0.15),
      }),
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    mono: {
      fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace',
    },
    h1: {
      fontSize: defaultTheme.typography.pxToRem(48),
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: defaultTheme.typography.pxToRem(36),
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: defaultTheme.typography.pxToRem(30),
      lineHeight: 1.2,
    },
    h4: {
      fontSize: defaultTheme.typography.pxToRem(24),
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h5: {
      fontSize: defaultTheme.typography.pxToRem(20),
      fontWeight: 600,
    },
    h6: {
      fontSize: defaultTheme.typography.pxToRem(18),
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: defaultTheme.typography.pxToRem(18),
    },
    subtitle2: {
      fontSize: defaultTheme.typography.pxToRem(14),
      fontWeight: 500,
    },
    body1: {
      fontSize: defaultTheme.typography.pxToRem(14),
    },
    body2: {
      fontSize: defaultTheme.typography.pxToRem(14),
      fontWeight: 400,
    },
    caption: {
      fontSize: defaultTheme.typography.pxToRem(12),
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: customShadows,
});

export const colorSchemes = {
  light: {
    palette: {
      primary: {
        light: brand[200],
        main: brand[400],
        dark: brand[700],
        contrastText: brand[50],
      },
      info: {
        light: brand[100],
        main: brand[300],
        dark: brand[600],
        contrastText: gray[50],
      },
      warning: {
        light: orange[300],
        main: orange[400],
        dark: orange[800],
      },
      error: {
        light: red[300],
        main: red[400],
        dark: red[800],
      },
      success: {
        light: green[300],
        main: green[400],
        dark: green[800],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[300], 0.4),
      background: {
        default: 'hsl(0, 0%, 99%)',
        paper: 'hsl(220, 35%, 97%)',
      },
      text: {
        primary: gray[800],
        secondary: gray[600],
        warning: orange[400],
      },
      action: {
        hover: alpha(gray[200], 0.2),
        selected: alpha(gray[200], 0.3),
      },
    },
  },
  dark: {
    palette: {
      primary: {
        contrastText: gray[900],
        light: brand[300],
        main: brand[400],
        dark: brand[700],
      },
      info: {
        contrastText: brand[300],
        light: brand[500],
        main: brand[700],
        dark: brand[900],
      },
      warning: {
        light: orange[300],
        main: orange[400],
        dark: orange[700],
      },
      error: {
        light: red[300],
        main: red[400],
        dark: red[700],
      },
      success: {
        light: green[300],
        main: green[400],
        dark: green[700],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[600], 0.3),
      background: {
        default: gray[900],  // #0a0e17
        paper: gray[800],    // #1a1f2e
      },
      text: {
        primary: gray[200],    // #e2e8f0
        secondary: gray[400],  // #94a3b8
      },
      action: {
        hover: alpha(gray[600], 0.2),
        selected: alpha(brand[400], 0.15),
      },
    },
  },
};

export const typography = {
  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  h1: {
    fontSize: defaultTheme.typography.pxToRem(48),
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: defaultTheme.typography.pxToRem(36),
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h3: {
    fontSize: defaultTheme.typography.pxToRem(30),
    lineHeight: 1.2,
  },
  h4: {
    fontSize: defaultTheme.typography.pxToRem(24),
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h5: {
    fontSize: defaultTheme.typography.pxToRem(20),
    fontWeight: 600,
  },
  h6: {
    fontSize: defaultTheme.typography.pxToRem(18),
    fontWeight: 600,
  },
  subtitle1: {
    fontSize: defaultTheme.typography.pxToRem(18),
  },
  subtitle2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 500,
  },
  body1: {
    fontSize: defaultTheme.typography.pxToRem(14),
  },
  body2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 400,
  },
  caption: {
    fontSize: defaultTheme.typography.pxToRem(12),
    fontWeight: 400,
  },
};

export const shape = {
  borderRadius: 8,
};
