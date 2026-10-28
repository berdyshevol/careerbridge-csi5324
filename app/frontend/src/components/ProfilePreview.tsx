"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/EmptyState";
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
import { readSession, saveSession } from "@/lib/session";
import { useEndSession } from "@/lib/useEndSession";

function detailsOf(profile: Profile): ProfileDetails {
  return Object.fromEntries(PROFILE_FIELDS.map((field) => [field, profile[field] ?? ""])) as ProfileDetails;
}

// UC-03 for the logged-in Applicant: the details and resume on file come from the backend (CO-03.1),
// the details are saved there (CO-03.2) and a new resume replaces the one on file (CO-03.3)
export default function ProfilePreview({ profile: onFile, token }: { profile: Profile; token: string }) {
  const router = useRouter();
  const endSession = useEndSession();
  const [details, setDetails] = useState(() => detailsOf(onFile));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [resume, setResume] = useState(onFile.resume);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileRefusal, setFileRefusal] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // A screen reader hears the first reason: focus moves to the first field the backend refused
  useEffect(() => {
    const first = PROFILE_FIELDS.find((field) => fieldErrors[field]);
    if (first) {
      document.getElementById(`profile-${first}`)?.focus();
    }
  }, [fieldErrors]);

  function handleResumeChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
    setFileRefusal("");
    setUploaded(false);
    setUploadError("");
  }

  // The backend checks the type and size (extension 6a), so its reason is the only one the applicant sees
  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      setResume(await uploadResume(token, selectedFile));
      setUploaded(true);
      setSelectedFile(null);
      if (fileInput.current) {
        fileInput.current.value = "";
      }
    } catch (err) {
      if (err instanceof ResumeRefused) {
        setFileRefusal(err.message);
        fileInput.current?.focus();
      } else if (err instanceof SessionEnded) {
        endSession();
        setUploadError("Your session has ended. Log in again to upload your resume.");
      } else {
        setUploadError("Unable to upload the resume. Your current resume is kept. Please try again.");
      }
    } finally {
      setUploading(false);
    }
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
            You keep one resume on your profile, and a new upload replaces it.
          </p>

          {resume ? (
            <div className="mt-5 rounded-xl border border-base-300 bg-base-200 p-4">
              <p className="font-semibold">{resume.fileName}</p>
              <p className="mt-1 text-sm text-muted">Uploaded {formatUtcDay(resume.uploadDate)}</p>
            </div>
          ) : (
            // UC-02 step 5: a new applicant lands here and is asked for a resume
            <div className="mt-5">
              <EmptyState>No resume on file yet. Add your resume here to apply for jobs.</EmptyState>
            </div>
          )}

          <form onSubmit={handleUpload} className="mt-5 space-y-5" noValidate>
            {uploadError && (
              <div role="alert" className="alert alert-error">
                <span>{uploadError}</span>
              </div>
            )}

            <FormField
              id="resume-file"
              type="file"
              label={resume ? "Replace your resume" : "Choose your resume"}
              accept=".pdf,.docx"
              hint="PDF or DOCX, at most 5 MB."
              error={fileRefusal || undefined}
              inputRef={fileInput}
              onChange={handleResumeChange}
            />

            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" className="btn" disabled={!selectedFile || uploading}>
                {uploading ? "Uploading..." : "Upload resume"}
              </button>
              {uploaded && (
                <p role="status" className="text-sm text-success">
                  Resume uploaded
                </p>
              )}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
