// A labelled input with its hint or, after a refusal, its reason (UC-02 extension 4a)
export default function FormField({
  id,
  label,
  error,
  hint,
  inputRef,
  ...input
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  inputRef?: React.Ref<HTMLInputElement>;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className">) {
  const note = error ?? hint;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        className={`input w-full ${error ? "input-error" : ""}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? `${id}-note` : undefined}
        {...input}
      />
      {note && (
        <p id={`${id}-note`} className={`text-sm ${error ? "text-error" : "text-muted"}`}>
          {note}
        </p>
      )}
    </div>
  );
}
