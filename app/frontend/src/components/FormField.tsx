type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

// A labelled input with its hint or, after a refusal, its reason (UC-02 extension 4a)
export default function FormField({
  id,
  label,
  error,
  hint,
  inputRef,
  ...input
}: FieldProps & {
  inputRef?: React.Ref<HTMLInputElement>;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className">) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {(described) => (
        <input id={id} ref={inputRef} className={`input w-full ${error ? "input-error" : ""}`} {...described} {...input} />
      )}
    </Field>
  );
}

// The same for text of several lines
export function TextAreaField({
  id,
  label,
  error,
  hint,
  inputRef,
  ...textarea
}: FieldProps & {
  inputRef?: React.Ref<HTMLTextAreaElement>;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className">) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {(described) => (
        <textarea
          id={id}
          ref={inputRef}
          className={`textarea min-h-28 w-full ${error ? "textarea-error" : ""}`}
          {...described}
          {...textarea}
        />
      )}
    </Field>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: FieldProps & {
  children: (described: { "aria-invalid"?: true; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const note = error ?? hint;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      {children({
        "aria-invalid": error ? true : undefined,
        "aria-describedby": note ? `${id}-note` : undefined,
      })}
      {note && (
        <p id={`${id}-note`} className={`text-sm ${error ? "text-error" : "text-muted"}`}>
          {note}
        </p>
      )}
    </div>
  );
}
