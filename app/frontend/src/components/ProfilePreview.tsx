"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import FileDrop from "@/components/FileDrop";
import FormField, { TextAreaField } from "@/components/FormField";
import PageTitle from "@/components/PageTitle";
import {
  formatUtcDay,
  PROFILE_FIELDS,
  PROFILE_MAX_LENGTH,
  ProfileRefused,
  ResumeRefused,
  SessionEnded,
  updateProfile,
  uploadResume,
  type Profile,
  type ProfileDetails,
  type ProfileField,
} from "@/lib/api";
import { readSession, sameSitePath, saveSession } from "@/lib/session";
import { useEndSession } from "@/lib/useEndSession";

const FAILURE =
  "Something went wrong. Details saved before the error are kept, and your previous resume is still on file.";

function detailsOf(profile: Profile): ProfileDetails {
  return Object.fromEntries(PROFILE_FIELDS.map((field) => [field, profile[field] ?? ""])) as ProfileDetails;
}

// UC-03 for the logged-in Applicant: the details and resume on file come from the backend (CO-03.1),
// the details are saved there (CO-03.2) and a new resume replaces the one on file (CO-03.3)
export default function ProfilePreview({
  profile: onFile,
  token,
  next,
}: {
  profile: Profile;
  token: string;
  next?: string;
}) {
  const router = useRouter();
  const endSession = useEndSession();
  const [details, setDetails] = useState(() => detailsOf(onFile));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resume, setResume] = useState(onFile.resume);
  const [refusedFile, setRefusedFile] = useState("");
  const [uploading, setUploading] = useState(false);
  // One message for a failure while saving or uploading (extension *a)
  const [failure, setFailure] = useState("");

  // A screen reader hears the first reason: focus moves to the first field the backend refused
  useEffect(() => {
    const first = PROFILE_FIELDS.find((field) => fieldErrors[field]);
    if (first) {
      document.getElementById(`profile-${first}`)?.focus();
    }
  }, [fieldErrors]);

  // Choosing a file uploads it at once. The backend checks the type and size (extension 6a); the
  // screen names the refused file and states the accepted types and size, as the mockup words it.
  async function handleResume(file: File) {
    if (uploading) return;
    setRefusedFile("");
    setFailure("");
    setSaved(false);
    setUploading(true);
    try {
      setResume(await uploadResume(token, file));
      // UC-04 2a and 3a: back to the application the applicant came from. Another site in next
      // is ignored and the applicant stays here, as without one.
      const back = sameSitePath(next);
      if (back) {
        router.push(back);
      }
    } catch (err) {
      if (err instanceof ResumeRefused) {
        setRefusedFile(file.name);
        document.getElementById("resume-file")?.focus();
      } else if (err instanceof SessionEnded) {
        endSession();
        setFailure("Your session has ended. Log in again to upload your resume.");
      } else {
        setFailure(FAILURE);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setSaved(false);
    setFailure("");
    setRefusedFile("");
    setSaving(true);
    try {
      const profile = await updateProfile(token, details);
      setDetails(detailsOf(profile));
      setSaved(true);
      // The header shows the name from the session, so a new name must reach it too
      const session = readSession();
      if (session) {
        const { firstName, lastName, phone } = profile;
        saveSession({ ...session, user: { ...session.user, firstName, lastName, phone } });
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ProfileRefused) {
        setFieldErrors(err.fieldErrors);
      } else if (err instanceof SessionEnded) {
        endSession();
        setFailure("Your session has ended. Log in again to save your profile.");
      } else {
        setFailure(FAILURE);
      }
    } finally {
      setSaving(false);
    }
  }

  function fieldProps(field: ProfileField) {
    return {
      id: `profile-${field}`,
      value: details[field],
      maxLength: PROFILE_MAX_LENGTH[field],
      error: fieldErrors[field],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDetails((previous) => ({ ...previous, [field]: event.target.value }));
        setSaved(false);
      },
    };
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <PageTitle>Profile and resume</PageTitle>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <form
          onSubmit={handleSave}
          aria-labelledby="details-heading"
          className="card min-w-0 flex-1 border border-base-300 bg-base-100"
          noValidate
        >
          <div className="card-body gap-4">
            <h2 id="details-heading" className="text-lg font-semibold">
              Details
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="First name" autoComplete="given-name" required {...fieldProps("firstName")} />
              <FormField label="Last name" autoComplete="family-name" required {...fieldProps("lastName")} />
              <FormField
                id="profile-email"
                label="Email"
                type="email"
                value={onFile.email}
                hint="Your log-in. It cannot be changed here."
                readOnly
              />
              <FormField label="Phone" type="tel" autoComplete="tel" {...fieldProps("phone")} />
              <FormField label="Location" autoComplete="address-level2" {...fieldProps("location")} />
              <FormField label="Headline" {...fieldProps("headline")} />
            </div>
            <TextAreaField label="Skills" {...fieldProps("skills")} />
            <TextAreaField label="Education" {...fieldProps("education")} />
            <TextAreaField label="Work experience" {...fieldProps("workExperience")} />
            {/* Beside the button, so a phone shows the outcome where the applicant just pressed */}
            {saved && (
              <div role="status" className="alert alert-soft alert-success">
                <span>Profile saved.</span>
              </div>
            )}
            {failure && (
              <div role="alert" className="alert alert-soft alert-error">
                <span>{failure}</span>
              </div>
            )}
            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save details"}
              </button>
            </div>
          </div>
        </form>

        <aside className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
          <section aria-labelledby="resume-heading" className="card border border-base-300 bg-base-100">
            <div className="card-body gap-3">
              <h2 id="resume-heading" className="text-lg font-semibold">
                Resume on file
              </h2>
              {/* Step 7: a screen reader hears the new resume's name and date */}
              <div aria-live="polite">
                {resume ? (
                  <div className="rounded-xl border border-base-300 px-4 py-3">
                    <p className="break-words text-sm font-semibold">{resume.fileName}</p>
                    <p className="text-xs text-muted">Uploaded {formatUtcDay(resume.uploadDate)}</p>
                  </div>
                ) : (
                  // UC-02 step 3: a new applicant lands here and is asked for a resume
                  <p className="text-muted">No resume on file.</p>
                )}
              </div>
              <FileDrop
                id="resume-file"
                accept=".pdf,.docx"
                hint={
                  uploading
                    ? "Uploading..."
                    : resume
                      ? "PDF or DOCX, up to 5 MB. It replaces the one above."
                      : "PDF or DOCX, up to 5 MB."
                }
                errorId={refusedFile ? "resume-file-refusal" : undefined}
                onFile={handleResume}
              />
              {resume && (
                <p className="text-sm text-muted">
                  Applications you already sent keep the resume they were sent with.
                </p>
              )}
            </div>
          </section>

          {refusedFile && (
            <div id="resume-file-refusal" role="alert" className="alert alert-soft alert-error">
              <span>
                <b>{refusedFile} was not uploaded.</b> Use a PDF or DOCX file of 5 MB or less. Your current
                resume is still on file.
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
