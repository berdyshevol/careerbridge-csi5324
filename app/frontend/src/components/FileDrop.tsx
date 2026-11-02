"use client";

// The "Choose a file" area: the whole dashed box is the label of a visually hidden file input, so a
// click or the keyboard opens the picker. The error may be drawn elsewhere on the screen; errorId
// ties it to the input, so a screen reader still hears it with the field.
export default function FileDrop({
  id,
  hint,
  accept,
  errorId,
  onFile,
}: {
  id: string;
  hint: string;
  accept: string;
  errorId?: string;
  // Optional only so /styleguide, a server component, can draw it
  onFile?: (file: File) => void;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="file"
        accept={accept}
        className="peer sr-only"
        aria-labelledby={`${id}-label`}
        aria-describedby={errorId ? `${id}-hint ${errorId}` : `${id}-hint`}
        aria-invalid={errorId ? true : undefined}
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Cleared, so choosing the same file again after a refusal still reports it
          event.target.value = "";
          if (file) onFile?.(file);
        }}
      />
      <label
        htmlFor={id}
        className="block cursor-pointer rounded-xl border-2 border-dashed border-base-300 bg-base-200 p-4 text-center text-sm text-muted hover:border-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
      >
        <span id={`${id}-label`} className="font-semibold text-primary">
          Choose a file
        </span>
        <span id={`${id}-hint`} className="block">
          {hint}
        </span>
      </label>
    </div>
  );
}
