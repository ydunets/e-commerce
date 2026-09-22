import * as stylex from '@stylexjs/stylex';

// Design tokens reconciled with the Figma design system
// (product-details-section-figma, node 1:1588). Each maps to a Figma
// variable; prefer the semantic tokens over the gray scale.
export const colors = stylex.defineVars({
  // Cool gray scale (legacy; a follow-up migrates these to Figma's neutral scale).
  gray100: '#f9fafb',
  gray200: '#d2d6db',
  gray300: '#9ca3af',
  gray400: '#6b7280',
  gray500: '#4b5563',
  gray600: '#374151',

  // Neutrals
  inkStrong: '#0a0a0a', // neutral-950 · Background/primary-inverted, Text/primary-hover
  ink: '#171717', // neutral-900 · Text/primary
  muted: '#525252', // neutral-600 · Text/secondary
  tertiary: '#737373', // neutral-500 · Text/tertiary (option labels)
  disabled: '#a3a3a3', // neutral-400 · Text/disabled, Icon/primary
  field: '#fafafa', // neutral-50 · Input/Form field background
  line: '#e5e5e5', // neutral-200 · Border/primary
  lineStrong: '#d4d4d4', // neutral-300 · Border/secondary (tab bar divider)
  surface: '#f5f5f5', // neutral-100 · Background/disabled
  surfaceStrong: '#e5e7eb', // Figma Background/secondary (applied coupon tag); outside both scales above

  // Brand
  brand: '#4338ca', // indigo-700 · Background/brand-primary
  brandDark: '#3730a3', // indigo-800 · Background/brand-primary-emphasize
  brandSolid: '#4f46e5', // indigo-600 · Border/brand-solid (selected)
  brandSoft: '#eef2ff', // indigo-50 · Background/brand-subtle
  brandLine: '#c7d2fe', // indigo-200 · Border/brand-subtle
  focus: '#444ce7', // focus ring

  // Status
  star: '#facc15', // yellow-400 · Icon/warning (rating)
  warning: '#b45309', // amber-700 · Text/warning (discount)
  warningSoft: '#fffbeb', // amber-50 · Background/warning-subtle
  warningLine: '#fde68a', // amber-200 · Border/warning-subtle
  success: '#15803d', // green-700 · Text/success
  successSoft: '#f0fdf4', // green-50 · Background/success-subtle
  successLine: '#bbf7d0', // green-200 · Border/success
  danger: '#b91c1c', // red-700 · error text (red-600 fails WCAG AA on the danger-subtle background)
  dangerSoft: '#fef2f2', // red-50 · Background/danger-subtle
  dangerLine: '#fecaca', // red-200 · Border/danger
});

// Elevation.
//   card   · Figma `shadow`    (buttons, cards): two-layer 1px lift.
//   cardLg · Figma `shadow-lg` (tooltips, overlays): floating panel.
export const shadows = stylex.defineVars({
  card: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
  cardLg:
    '0px 4px 6px -4px rgba(0, 0, 0, 0.1), 0px 10px 15px -3px rgba(0, 0, 0, 0.1)',
});
