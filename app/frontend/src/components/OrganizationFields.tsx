import type { OrganizationDetails, OrganizationField } from "@/lib/api";
import FormField, { TextAreaField } from "./FormField";

export const EMPTY_ORGANIZATION: OrganizationDetails = {
  name: "",
  website: "",
  industry: "",
  headquarters: "",
  size: "",
  description: "",
};

const LABELS: Record<Exclude<OrganizationField, "description">, string> = {
  name: "Legal name",
  website: "Website",
  industry: "Industry",
  headquarters: "Headquarters",
  size: "Size",
};

// UC-08 step 3, also entered for a new organization in UC-09 extension 3a
export default function OrganizationFields({
  idPrefix,
  values,
  onChange,
  errors = {},
}: {
  idPrefix: string;
  values: OrganizationDetails;
  onChange: (values: OrganizationDetails) => void;
  errors?: Partial<Record<OrganizationField, React.ReactNode>>;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((name) => (
          <FormField
            key={name}
            id={`${idPrefix}-${name}`}
            label={LABELS[name]}
            value={values[name]}
            onChange={(event) => onChange({ ...values, [name]: event.target.value })}
            error={errors[name]}
            maxLength={255}
            required={name === "name" || name === "website"}
          />
        ))}
      </div>
      <TextAreaField
        id={`${idPrefix}-description`}
        label="Short description"
        value={values.description}
        onChange={(event) => onChange({ ...values, description: event.target.value })}
        error={errors.description}
        maxLength={255}
      />
    </>
  );
}

// The backend names the organization's fields organization.<field>
export function organizationErrors<T>(fieldErrors: Record<string, T | undefined>): Partial<Record<OrganizationField, T>> {
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([name]) => name.startsWith("organization."))
      .map(([name, reason]) => [name.slice("organization.".length), reason]),
  ) as Partial<Record<OrganizationField, T>>;
}
