"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import FormField, { TextAreaField } from "@/components/FormField";
import PageTitle from "@/components/PageTitle";
import {
  formatDate,
  PROFILE_FIELDS,
  PROFILE_MAX_LENGTH,
  ProfileRefused,
  SessionEnded,
  updateProfile,
  type Profile,
  type ProfileDetails,
  type ProfileField,
} from "@/lib/api";
import { readSession, saveSession } from "@/lib/session";
import { useEndSession } from "@/lib/useEndSession";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function detailsOf(profile: Profile): ProfileDetails {
  return Object.fromEntries(PROFILE_FIELDS.map((field) => [field, profile[field] ?? ""])) as ProfileDetails;
}

// UC-03 for the logged-in Applicant: the details and resume on file come from the backend (CO-03.1)
// and the details are saved there (CO-03.2). Uploading a resume (SCRUM-163) is not connected yet.
export default function ProfilePreview({ profile: onFile, token }: { profile: Profile; token: string }) {
  const router = useRouter();
  const endSession = useEndSession();
  const [details, setDetails] = useState(() => detailsOf(onFile));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  // A screen reader hears the first reason: focus moves to the first field the backend refused
  useEffect(() => {
    const first = PROFILE_FIELDS.find((field) => fieldErrors[field]);
    if (first) {
      document.getElementById(`profile-${first}`)?.focus();
    }
  }, [fieldErrors]);

  function handleResumeChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileError("");
    setSelectedFile(null);

    if (!file) return;

    const validExtension = /\.(pdf|docx)$/i.test(file.name);

    if (!validExtension) {
      setFileError("Please select a PDF or DOCX file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("The resume must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setSaved(false);
    setError("");
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
        setError("Your session has ended. Log in again to save your profile.");
      } else {
        setError("Unable to save the profile. Please try again.");
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
    <div className="w-full space-y-6">
      <PageTitle
        eyebrow="Applicant account"
        subtitle="Review your information and the resume you apply with."
      >
        Profile & resume
      </PageTitle>

      <section className="card border border-base-300 bg-base-100">
        <div className="card-body">
          <h2 className="font-display text-xl font-semibold">Personal information</h2>

          <form onSubmit={handleSave} className="mt-5 space-y-5" noValidate>
            {error && (
              <div role="alert" className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="First name" autoComplete="given-name" required {...fieldProps("firstName")} />
              <FormField label="Last name" autoComplete="family-name" required {...fieldProps("lastName")} />
              <FormField
                id="profile-email"
                label="Email address"
                type="email"
                value={onFile.email}
                hint="You log in with this address, so it cannot be changed here."
                readOnly
              />
              <FormField
                label="Phone number"
                type="tel"
                autoComplete="tel"
                hint="Optional, for example (254) 555-0142."
                {...fieldProps("phone")}
              />
              <FormField label="Location" autoComplete="address-level2" hint="Optional, for example Waco, TX." {...fieldProps("location")} />
              <FormField label="Headline" hint="Optional, for example Data analyst." {...fieldProps("headline")} />
            </div>
            <TextAreaField label="Skills" {...fieldProps("skills")} />
            <TextAreaField label="Education" {...fieldProps("education")} />
            <TextAreaField label="Work experience" {...fieldProps("workExperience")} />

            <div className="flex flex-wrap items-center gap-4 border-t border-base-300 pt-5">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
              {saved && (
                <p role="status" className="text-sm text-success">
                  Profile saved
                </p>
              )}
            </div>
          </form>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100">
        <div className="card-body">
          <h2 className="font-display text-xl font-semibold">Your resume</h2>
          <p className="mt-2 text-muted">
            You can keep one current resume on your profile.
            Accepted formats: PDF or DOCX, maximum 5 MB.
          </p>

          {onFile.resume ? (
            <div className="mt-5 rounded-xl border border-base-300 bg-base-200 p-4">
              <p className="font-semibold">{onFile.resume.fileName}</p>
              <p className="mt-1 text-sm text-muted">
                Uploaded {formatDate(onFile.resume.uploadDate.slice(0, 10))}
              </p>
            </div>
          ) : (
            // UC-02 step 5: a new applicant lands here and is asked for a resume
            <div className="mt-5">
              <EmptyState>No resume on file yet. Add your resume here to apply for jobs.</EmptyState>
            </div>
          )}

          <div className="mt-5">
            <label
              htmlFor="resume-file"
              className="mb-2 block text-sm font-semibold"
            >
              Select a new resume
            </label>
            <input
              id="resume-file"
              type="file"
              accept=".pdf,.docx"
              onChange={handleResumeChange}
              className="file-input w-full max-w-md"
            />
          </div>

          {fileError && (
            <p role="alert" className="mt-3 text-sm text-error">
              {fileError}
            </p>
          )}

          {selectedFile && (
            <div className="mt-4 rounded-xl bg-secondary p-4">
              <p className="font-semibold text-secondary-content">
                Ready for upload: {selectedFile.name}
              </p>
              <p className="mt-1 text-sm text-muted">
                {(selectedFile.size / 1024).toFixed(1)} KB · Uploading is not connected yet,
                so this file is not saved
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
