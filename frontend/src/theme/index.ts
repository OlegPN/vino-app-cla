export const theme = {
  colors: {
    primary: '#722F37',       // Wine red
    primaryLight: '#9B4D55',
    primaryDark: '#4A1E24',
    secondary: '#C8A97E',     // Gold/champagne
    background: '#FFFFFF',
    surface: '#F8F4F0',
    surfaceAlt: '#F0EBE3',
    text: '#1A1A1A',
    textSecondary: '#6B6B6B',
    textLight: '#9E9E9E',
    border: '#E0D6CC',
    success: '#4CAF50',
    error: '#D32F2F',
    white: '#FFFFFF',
    starFilled: '#F4B400',
    starEmpty: '#E0D6CC',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export type Theme = typeof theme;
