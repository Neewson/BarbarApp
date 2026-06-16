// Barbar.app Design System
export const Colors = {
  // Core backgrounds
  background: '#080B11',
  surface: '#0F1318',
  surface2: '#161C24',
  surface3: '#1E2630',
  surfaceElevated: '#232C38',

  // Brand
  primary: '#C9A227',      // Gold
  primaryLight: '#DEB94A',
  primaryDark: '#A8851C',
  primaryMuted: 'rgba(201,162,39,0.12)',

  // Accent blue (security/trust)
  accent: '#1B3A6B',
  accentLight: '#2952A3',
  accentMuted: 'rgba(27,58,107,0.3)',

  // Text
  textPrimary: '#F0F2F5',
  textSecondary: '#8A9BB0',
  textMuted: '#4A5568',
  textInverse: '#080B11',

  // Borders
  border: '#1E2630',
  borderLight: '#2A3444',

  // Semantic
  success: '#10C97B',
  successMuted: 'rgba(16,201,123,0.12)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245,158,11,0.12)',
  error: '#EF4444',
  errorMuted: 'rgba(239,68,68,0.12)',
  info: '#3B82F6',
  infoMuted: 'rgba(59,130,246,0.12)',

  // Status colors
  statusBooked: '#3B82F6',
  statusConfirmed: '#10C97B',
  statusInProgress: '#C9A227',
  statusDone: '#6B7280',
  statusCancelled: '#EF4444',
  statusRescheduled: '#8B5CF6',

  // Overlay
  overlay: 'rgba(8,11,17,0.85)',
  overlayLight: 'rgba(8,11,17,0.5)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 34,
  hero: 42,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  gold: {
    shadowColor: '#C9A227',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};
