import * as stylex from '@stylexjs/stylex';
import { useEffect, useId, useRef, useState } from 'react';
import { colors } from '@/shared/ui/tokens.stylex';

type TSelectedPhoto = {
  name: string;
  url: string;
};

const FIELD_LABEL = 'Add a photo';
const ACCEPTED_TYPES = 'image/*';

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
    paddingTop: '1.5rem',
  },
  label: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 600,
    color: colors.ink,
  },
  input: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: colors.muted,
    '::file-selector-button': {
      marginRight: '0.75rem',
      borderRadius: '0.25rem',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: colors.line,
      backgroundColor: colors.surface,
      paddingInline: '0.75rem',
      paddingBlock: '0.375rem',
      color: colors.ink,
    },
  },
  preview: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  image: {
    height: '4rem',
    width: '4rem',
    borderRadius: '0.25rem',
    objectFit: 'cover',
  },
  caption: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: colors.muted,
  },
  remove: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 600,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
});

export const ReviewPhotoPicker = () => {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<TSelectedPhoto | null>(null);

  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.url);
  }, [photo]);

  const selectPhoto = (file: File | undefined) => {
    setPhoto(file ? { name: file.name, url: URL.createObjectURL(file) } : null);
  };

  const removePhoto = () => {
    setPhoto(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div {...stylex.props(styles.root)}>
      <label {...stylex.props(styles.label)} htmlFor={fieldId}>
        {FIELD_LABEL}
      </label>
      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept={ACCEPTED_TYPES}
        {...stylex.props(styles.input)}
        onChange={(event) => selectPhoto(event.target.files?.[0])}
      />
      {photo && (
        <figure {...stylex.props(styles.preview)}>
          <img
            src={photo.url}
            alt={`Preview of ${photo.name}`}
            {...stylex.props(styles.image)}
          />
          <figcaption {...stylex.props(styles.caption)}>
            {photo.name}
          </figcaption>
          <button
            type="button"
            {...stylex.props(styles.remove)}
            onClick={removePhoto}
          >
            Remove
          </button>
        </figure>
      )}
    </div>
  );
};
