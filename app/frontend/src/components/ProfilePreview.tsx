
"use client";

import { useState, type ChangeEvent } from "react";
import EmptyState from "@/components/EmptyState";
import PageTitle from "@/components/PageTitle";
import { formatDate, type Profile } from "@/lib/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// UC-03 for the logged-in Applicant: the details and resume on file come from the backend (CO-03.1).
// Saving the details (SCRUM-162) and uploading a resume (SCRUM-163) are not connected yet.
export default function ProfilePreview({ profile: onFile }: { profile: Profile }) {
  const [profile, setProfile] = useState({
    firstName: onFile.firstName,
    lastName: onFile.lastName,
    email: onFile.email,
    phone: onFile.phone ?? "",
    location: "",
    skills: "",
    education: "",
    experience: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  function updateField(field: keyof typeof profile, value: string) {
    setProfile((previous) => ({ ...previous, [field]: value }));
    setProfileMessage("");
  }

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

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage("Saving is not connected yet: your changes were not saved.");
  }

  return (
    <div className="w-full space-y-6">
      <PageTitle
        eyebrow="Applicant account"
        subtitle="Review your information and the resume you apply with."
      >
        Profile & resume
      </PageTitle>

      <div className="alert border border-base-300 bg-secondary text-secondary-content">
        These are the details and the resume on file in your account. Editing them and uploading a
        new resume are not connected yet, so changes made here are not saved.
      </div>

      <section className="card border border-base-300 bg-base-100">
        <div className="card-body">
          <h2 className="font-display text-xl font-semibold">Personal information</h2>

          <form onSubmit={handleSave} className="mt-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ["firstName", "First name"],
                  ["lastName", "Last name"],
                  ["email", "Email address"],
                  ["phone", "Phone number"],
                  ["location", "Location"],
                  ["skills", "Skills"],
                  ["education", "Education"],
                  ["experience", "Work experience"],
                ] as const
              ).map(([field, label]) => (
                <label key={field} className="form-control block">
                  <span className="mb-2 block text-sm font-semibold">
                    {label}
                  </span>
                  <input
                    className="input w-full border-base-300 bg-base-100"
                    type={field === "email" ? "email" : "text"}
                    value={profile[field]}
                    onChange={(event) =>
                      updateField(field, event.target.value)
                    }
                    required={field === "firstName" || field === "lastName"}
                  />
                </label>
              ))}
            </div>

            <button type="submit" className="btn btn-primary">
              Save changes (not connected yet)
            </button>

            {profileMessage && (
              <p role="status" className="text-sm text-muted">
                {profileMessage}
              </p>
            )}
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
