import * as stylex from '@stylexjs/stylex';

// Keeps text for assistive technology while removing it from the layout.
export const visuallyHidden = stylex.create({
  root: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
});
