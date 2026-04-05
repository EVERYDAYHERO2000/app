import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#F8604A' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          // 16px * 0.875 = 14px -> 1rem = 14px
          fontSize: '87.5%',
        },
      },
    },
  },
  shape: { borderRadius: 8 },
});
