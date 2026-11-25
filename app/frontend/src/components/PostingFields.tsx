import FormField, { SelectField, TextAreaField } from "./FormField";
import { EMPLOYMENT_TYPES, LOCATIONS } from "@/lib/postingOptions";
import type { JobPosting } from "@/lib/api";

// What a recruiter types into a posting (UC-11 step 3), as the form holds it
export type PostingDetails = {
  title: string;
  description: string;
  jobRequirements: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  numberOfOpenings: string;
  applicationDeadline: string;
};

export const EMPTY_DETAILS: PostingDetails = {
  title: "",
  description: "",
  jobRequirements: "",
  location: "",
  employmentType: "Full-time",
  salaryRange: "",
  numberOfOpenings: "1",
  applicationDeadline: "",
};

export function detailsOf(posting: JobPosting): PostingDetails {
  return {
    title: posting.title ?? "",
    description: posting.description ?? "",
    jobRequirements: posting.jobRequirements ?? "",
    location: posting.location ?? "",
    employmentType: posting.employmentType ?? "Full-time",
    salaryRange: posting.salaryRange ?? "",
    numberOfOpenings: String(posting.numberOfOpenings ?? 1),
    applicationDeadline: posting.applicationDeadline ?? "",
  };
}

// The body the backend reads for a new or a changed posting
export function requestOf(details: PostingDetails) {
  return {
    title: details.title.trim(),
    description: details.description.trim(),
    jobRequirements: details.jobRequirements.trim(),
    location: details.location,
    employmentType: details.employmentType,
    salaryRange: details.salaryRange.trim() || null,
    numberOfOpenings: Number(details.numberOfOpenings),
    applicationDeadline: details.applicationDeadline,
  };
}

type Field = keyof PostingDetails;

// The backend refuses one field at a time with a reason that names it (UC-11 extensions 5a, 5b);
// the reason is shown under that field, as the mockup draws it
const FIELD_OF_REASON: [RegExp, Field][] = [
  [/title/i, "title"],
  [/deadline/i, "applicationDeadline"],
  [/opening/i, "numberOfOpenings"],
  [/description/i, "description"],
  [/requirement/i, "jobRequirements"],
  [/location/i, "location"],
  [/employment type/i, "employmentType"],
  [/salary/i, "salaryRange"],
];

export const editPostingPath = (postingId: number) => `/recruiter/postings/${postingId}/edit`;

function fieldOf(reason: string): Field | null {
  return FIELD_OF_REASON.find(([pattern]) => pattern.test(reason))?.[1] ?? null;
}

// The posting's fields in the order of the recruiter-posting-form mockup. A refusal that names a
// field shows under it; any other, such as an unknown organization, shows below the fields.
export default function PostingFields({
  details,
  onChange,
  refused,
}: {
  details: PostingDetails;
  onChange: (details: PostingDetails) => void;
  // The backend's reason for refusing the posting, shown under the field it names
  refused?: string;
}) {
  const refusedField = refused ? fieldOf(refused) : null;
  const errorOf = (field: Field) => (refusedField === field ? refused : undefined);
  const set = (field: Field) => (event: { target: { value: string } }) =>
    onChange({ ...details, [field]: event.target.value });
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <div className="flex flex-col gap-5">
      <FormField
        id="title"
        label="Title"
        maxLength={255}
        value={details.title}
        onChange={set("title")}
        error={errorOf("title")}
        required
      />
      <div className="grid gap-5 md:grid-cols-2">
        <SelectField
          id="location"
          label="Location"
          value={details.location}
          onChange={set("location")}
          error={errorOf("location")}
        >
          <option value="" disabled>
            Choose a location
          </option>
          {LOCATIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectField>
        <SelectField
          id="employmentType"
          label="Employment type"
          value={details.employmentType}
          onChange={set("employmentType")}
          error={errorOf("employmentType")}
        >
          {EMPLOYMENT_TYPES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectField>
        <FormField
          id="salary"
          label="Salary range, optional"
          maxLength={255}
          value={details.salaryRange}
          onChange={set("salaryRange")}
          error={errorOf("salaryRange")}
        />
        <FormField
          id="deadline"
          label="Application deadline"
          type="date"
          min={today}
          hint="Between 1 and 90 days from today."
          value={details.applicationDeadline}
          onChange={set("applicationDeadline")}
          error={errorOf("applicationDeadline")}
          required
        />
        <FormField
          id="openings"
          label="Openings"
          type="number"
          min={1}
          step={1}
          value={details.numberOfOpenings}
          onChange={set("numberOfOpenings")}
          error={errorOf("numberOfOpenings")}
          required
        />
      </div>
      <TextAreaField
        id="description"
        label="Description"
        maxLength={10000}
        value={details.description}
        onChange={set("description")}
        error={errorOf("description")}
      />
      <TextAreaField
        id="requirements"
        label="Requirements"
        maxLength={2000}
        value={details.jobRequirements}
        onChange={set("jobRequirements")}
        error={errorOf("jobRequirements")}
      />
      {refused && !refusedField && (
        <div role="alert" className="alert alert-error">
          <span>{refused}</span>
        </div>
      )}
    </div>
  );
}
