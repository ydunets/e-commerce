import { useRef, useState } from 'react';

type TSelectedPhoto = {
  name: string;
  url: string;
};

const FIELD_LABEL = 'Add a photo';
const ACCEPTED_TYPES = 'image/*';

export const ReviewPhotoPicker = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<TSelectedPhoto | null>(null);

  const replacePhoto = (next: TSelectedPhoto | null) => {
    setPhoto((previous) => {
      if (previous) URL.revokeObjectURL(previous.url);
      return next;
    });
  };

  const selectPhoto = (file: File | undefined) => {
    replacePhoto(
      file ? { name: file.name, url: URL.createObjectURL(file) } : null,
    );
  };

  const removePhoto = () => {
    replacePhoto(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-6">
      <label className="text-sm font-semibold text-ink" htmlFor="review-photo">
        {FIELD_LABEL}
      </label>
      <input
        ref={inputRef}
        id="review-photo"
        type="file"
        accept={ACCEPTED_TYPES}
        className="text-sm text-muted file:mr-3 file:rounded-sm file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-ink"
        onChange={(event) => selectPhoto(event.target.files?.[0])}
      />
      {photo && (
        <figure className="flex items-center gap-3">
          <img
            src={photo.url}
            alt={`Preview of ${photo.name}`}
            className="h-16 w-16 rounded-sm object-cover"
          />
          <figcaption className="flex-1 truncate text-sm text-muted">
            {photo.name}
          </figcaption>
          <button
            type="button"
            className="text-sm font-semibold text-ink underline"
            onClick={removePhoto}
          >
            Remove
          </button>
        </figure>
      )}
    </div>
  );
};
