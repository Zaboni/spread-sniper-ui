import { alpha } from '@mui/material/styles';
import type { Theme, Components } from '@mui/material/styles';
import { gray, brand } from '../themePrimitives';

export const surfacesCustomizations: Components<Theme> = {
  MuiAccordion: {
    defaultProps: {
      elevation: 0,
      disableGutters: true,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        padding: 4,
        overflow: 'clip',
        backgroundColor: (theme.vars || theme).palette.background.default,
        border: '1px solid',
        borderColor: (theme.vars || theme).palette.divider,
        ':before': {
          backgroundColor: 'transparent',
        },
        '&:not(:last-of-type)': {
          borderBottom: 'none',
        },
        '&:first-of-type': {
          borderTopLeftRadius: (theme.vars || theme).shape.borderRadius,
          borderTopRightRadius: (theme.vars || theme).shape.borderRadius,
        },
        '&:last-of-type': {
          borderBottomLeftRadius: (theme.vars || theme).shape.borderRadius,
          borderBottomRightRadius: (theme.vars || theme).shape.borderRadius,
        },
      }),
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: ({ theme }) => ({
        border: 'none',
        borderRadius: 8,
        '&:hover': { backgroundColor: gray[50] },
        '&:focus-visible': { backgroundColor: 'transparent' },
        ...theme.applyStyles('dark', {
          '&:hover': { backgroundColor: alpha(gray[700], 0.3) },
        }),
      }),
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: { mb: 20, border: 'none' },
    },
  },
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        ...theme.applyStyles('dark', {
          backgroundImage: 'none',
        }),
      }),
    },
  },
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => {
        return {
          padding: 16,
          gap: 16,
          transition: 'all 100ms ease',
          backgroundColor: gray[50],
          borderRadius: (theme.vars || theme).shape.borderRadius,
          border: `1px solid ${(theme.vars || theme).palette.divider}`,
          boxShadow: 'none',
          ...theme.applyStyles('dark', {
            backgroundColor: gray[800],
            border: `1px solid ${alpha(gray[600], 0.3)}`,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
          }),
          variants: [
            {
              props: {
                variant: 'outlined',
              },
              style: {
                border: `1px solid ${(theme.vars || theme).palette.divider}`,
                boxShadow: 'none',
                background: 'hsl(0, 0%, 100%)',
                ...theme.applyStyles('dark', {
                  background: gray[800],
                  border: `1px solid ${alpha(gray[600], 0.3)}`,
                }),
              },
            },
          ],
        };
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 0,
        '&:last-child': { paddingBottom: 0 },
      },
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
  MuiCardActions: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
  MuiTableContainer: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: (theme.vars || theme).shape.borderRadius,
        ...theme.applyStyles('dark', {
          backgroundColor: 'transparent',
        }),
      }),
    },
  },
  MuiTable: {
    styleOverrides: {
      root: ({ theme }) => ({
        ...theme.applyStyles('dark', {
          backgroundColor: 'transparent',
        }),
      }),
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: ({ theme }) => ({
        ...theme.applyStyles('dark', {
          '& .MuiTableCell-root': {
            backgroundColor: alpha(gray[900], 0.5),
            borderBottom: `1px solid ${alpha(gray[600], 0.3)}`,
            color: gray[400],
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        }),
      }),
    },
  },
  MuiTableBody: {
    styleOverrides: {
      root: ({ theme }) => ({
        ...theme.applyStyles('dark', {
          '& .MuiTableRow-root': {
            '&:nth-of-type(odd)': {
              backgroundColor: alpha(gray[800], 0.3),
            },
            '&:nth-of-type(even)': {
              backgroundColor: alpha(gray[800], 0.6),
            },
            '&:hover': {
              backgroundColor: alpha(brand[400], 0.08),
            },
            '& .MuiTableCell-root': {
              borderBottom: `1px solid ${alpha(gray[600], 0.2)}`,
            },
          },
        }),
      }),
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: '12px 16px',
        ...theme.applyStyles('dark', {
          borderColor: alpha(gray[600], 0.2),
        }),
      }),
    },
  },
};
