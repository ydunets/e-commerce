import * as stylex from '@stylexjs/stylex';
import { focusRing } from '@/shared/ui/focus-ring';
import { colors } from '@/shared/ui/tokens.stylex';

const SHEET_URL = '/spec-sheet.html';
const SHEET_TITLE = 'Care and materials';

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  title: {
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    fontWeight: 600,
    color: colors.ink,
  },
  download: {
    borderRadius: '0.25rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.line,
    backgroundColor: '#fff',
    paddingInline: '1rem',
    paddingBlock: '0.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 600,
    color: colors.ink,
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
  frame: {
    height: '14rem',
    width: '100%',
    borderRadius: '0.25rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.line,
    backgroundColor: '#fff',
  },
});

export const SpecificationSheet = () => (
  <div {...stylex.props(styles.root)}>
    <div {...stylex.props(styles.header)}>
      <h3 {...stylex.props(styles.title)}>{SHEET_TITLE}</h3>
      <a
        {...stylex.props(styles.download, focusRing.ring)}
        href={SHEET_URL}
        download
      >
        Download specification sheet
      </a>
    </div>
    {/* oxlint-disable-next-line react/iframe-missing-sandbox -- same-origin static document; a sandbox blocks the dev server's injected client and floods the console. */}
    <iframe
      {...stylex.props(styles.frame)}
      title={SHEET_TITLE}
      src={SHEET_URL}
      loading="lazy"
    />
  </div>
);
