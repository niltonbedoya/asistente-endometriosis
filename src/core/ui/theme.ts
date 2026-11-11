export const clinicalTheme = {
  color: {
    page: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    focus: '#2563EB',
    emergencyBackground: '#7F1D1D',
    emergencyForeground: '#FFFFFF',
  },
  spacing: { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 },
  control: { minimumTouchTarget: 44, radius: 8 },
  status: {
    RED: { background: '#7F1D1D', foreground: '#FFFFFF', icon: '!' },
    YELLOW: { background: '#92400E', foreground: '#FFFFFF', icon: '!' },
    GREEN: { background: '#166534', foreground: '#FFFFFF', icon: '✓' },
  },
} as const;

export type ClinicalStatus = keyof typeof clinicalTheme.status;

const STATUS_LABELS: Record<ClinicalStatus, string> = {
  RED: 'Crisis activa',
  YELLOW: 'Molestia moderada',
  GREEN: 'Ventana estable',
};

export function clinicalStatusPresentation(status: ClinicalStatus) {
  const token = clinicalTheme.status[status];
  return {
    label: STATUS_LABELS[status],
    icon: token.icon,
    backgroundColor: token.background,
    foregroundColor: token.foreground,
    accessibilityLabel: `${STATUS_LABELS[status]}. Estado ${status === 'RED' ? 'de emergencia' : 'de seguimiento'}.`,
    accessibilityLiveRegion: status === 'RED' ? ('assertive' as const) : ('polite' as const),
  };
}
