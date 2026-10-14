
"use client";

import { useState, type ChangeEvent } from "react";
import { applicant, resume } from "@/lib/sampleDesk";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    email: applicant.email,
    phone: applicant.phone,
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
    setProfileMessage(
      "Profile changes are shown in this preview only. Backend saving is not connected yet."
    );
  }

  return (
    <main className="w-full space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">
          Applicant account
        </p>
        <h1 className="mt-2 text-3xl font-bold">Profile & resume</h1>
        <p className="mt-2 text-muted">
          Review your information and prepare your resume for job applications.
        </p>
      </div>

      <div className="alert border border-base-300 bg-secondary text-secondary-content">
        This page is a frontend preview using sample applicant data.
        Changes are not saved to the server yet.
      </div>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-6">
        <h2 className="text-xl font-semibold">Personal information</h2>

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
            Preview profile changes
          </button>

          {profileMessage && (
            <p role="status" className="text-sm text-muted">
              {profileMessage}
            </p>
          )}
        </form>
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-6">
        <h2 className="text-xl font-semibold">Your resume</h2>
        <p className="mt-2 text-muted">
          You can keep one current resume on your profile.
          Accepted formats: PDF or DOCX, maximum 5 MB.
        </p>

        {resume && (
          <div className="mt-5 rounded-xl border border-base-300 bg-base-200 p-4">
            <p className="font-semibold">{resume.fileName}</p>
            <p className="mt-1 text-sm text-muted">
              Sample resume · Uploaded {resume.uploadDate}
            </p>
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
              {(selectedFile.size / 1024).toFixed(1)} KB ·
              File selected locally, not uploaded to the server
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

