import { fireEvent, render, screen } from "@testing-library/react";
import { ProfileRefused, ResumeRefused, SessionEnded, updateProfile, uploadResume, type Profile } from "@/lib/api";
import { clearSession, readSession, saveSession } from "@/lib/session";
import ProfilePreview from "./ProfilePreview";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  updateProfile: vi.fn(),
  uploadResume: vi.fn(),
}));

const jordan: Profile = {
  firstName: "Jordan",
  lastName: "Lee",
  email: "jordan.lee@example.com",
  phone: "(254) 555-0142",
  location: "Waco, TX",
  headline: null,
  skills: "SQL, Python",
  education: null,
  workExperience: null,
  resume: { fileName: "Jordan_Lee_CV.pdf", uploadDate: "2026-10-01T09:30:00" },
};

function show(profile: Profile = jordan) {
  render(<ProfilePreview profile={profile} token="t" />);
}

describe("ProfilePreview", () => {
  afterEach(() => {
    vi.mocked(updateProfile).mockReset();
    vi.mocked(uploadResume).mockReset();
    refresh.mockReset();
    clearSession();
  });

  it("shows the applicant's details from the backend (UC-03 steps 1–2)", () => {
    show();

    expect(screen.getByLabelText("First name")).toHaveValue("Jordan");
    expect(screen.getByLabelText("Last name")).toHaveValue("Lee");
    expect(screen.getByLabelText("Email address")).toHaveValue("jordan.lee@example.com");
    expect(screen.getByLabelText("Email address")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Phone number")).toHaveValue("(254) 555-0142");
    expect(screen.getByLabelText("Location")).toHaveValue("Waco, TX");
    expect(screen.getByLabelText("Headline")).toHaveValue("");
    expect(screen.getByLabelText("Skills")).toHaveValue("SQL, Python");
    expect(screen.getByLabelText("Work experience")).toHaveValue("");
  });

  it("shows the resume on file with its upload date", () => {
    show();

    expect(screen.getByText("Jordan_Lee_CV.pdf")).toBeInTheDocument();
    expect(screen.getByText("Uploaded Oct 1, 2026")).toBeInTheDocument();
  });

  it("says there is no resume yet when none is on file", () => {
    show({ ...jordan, phone: null, resume: null });

    expect(screen.getByText(/No resume on file yet/)).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toHaveValue("");
  });

  it("saves every detail and says the profile is saved (UC-03 steps 3–4)", async () => {
    vi.mocked(updateProfile).mockResolvedValue({ ...jordan, phone: "(254) 555-0199", headline: "Data analyst" });
    show();

    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "(254) 555-0199" } });
    fireEvent.change(screen.getByLabelText("Headline"), { target: { value: "Data analyst" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Profile saved");
    expect(updateProfile).toHaveBeenCalledWith("t", {
      firstName: "Jordan",
      lastName: "Lee",
      phone: "(254) 555-0199",
      location: "Waco, TX",
      headline: "Data analyst",
      skills: "SQL, Python",
      education: "",
      workExperience: "",
    });
    expect(screen.getByLabelText("Headline")).toHaveValue("Data analyst");
  });

  it("puts a new name into the session, so the header shows it", async () => {
    saveSession({ token: "t", user: { firstName: "Jordan", lastName: "Lee", email: jordan.email, phone: null, role: "APPLICANT" } });
    vi.mocked(updateProfile).mockResolvedValue({ ...jordan, firstName: "Jordy" });
    show();

    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Jordy" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await screen.findByRole("status");
    expect(readSession()?.user.firstName).toBe("Jordy");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows each refused field's reason next to it and moves focus to the first (extension 4a)", async () => {
    vi.mocked(updateProfile).mockRejectedValue(new ProfileRefused({
      firstName: "Enter your first name.",
      phone: "Enter a phone number like (254) 555-0142.",
    }));
    show();

    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Enter your first name.")).toBeInTheDocument();
    expect(screen.getByLabelText("First name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("First name")).toHaveFocus();
    expect(screen.getByLabelText("Phone number")).toHaveAccessibleDescription("Enter a phone number like (254) 555-0142.");
    expect(screen.queryByText("Profile saved")).not.toBeInTheDocument();
  });

  it("ends a session the backend refused", async () => {
    vi.mocked(updateProfile).mockRejectedValue(new SessionEnded());
    show();

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Your session has ended");
    expect(refresh).toHaveBeenCalled();
  });

  it("says when the profile could not be saved", async () => {
    vi.mocked(updateProfile).mockRejectedValue(new Error("Backend answered 500"));
    show();

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to save the profile");
  });

  describe("uploading a resume (UC-03 steps 5–7)", () => {
    const pdf = new File(["%PDF-1.4"], "Jordan_Lee_2026.pdf", { type: "application/pdf" });

    function choose(file: File, label = "Replace your resume") {
      fireEvent.change(screen.getByLabelText(label), { target: { files: [file] } });
    }

    it("can upload only once a file is chosen", () => {
      show();

      expect(screen.getByRole("button", { name: "Upload resume" })).toBeDisabled();
      choose(pdf);
      expect(screen.getByRole("button", { name: "Upload resume" })).toBeEnabled();
      expect(screen.getByLabelText("Replace your resume")).toHaveAccessibleDescription("PDF or DOCX, at most 5 MB.");
    });

    it("shows the new resume's name and upload date in place of the previous one", async () => {
      vi.mocked(uploadResume).mockResolvedValue({ fileName: "Jordan_Lee_2026.pdf", uploadDate: "2026-10-27T14:05:00" });
      show();

      choose(pdf);
      fireEvent.click(screen.getByRole("button", { name: "Upload resume" }));

      expect(await screen.findByRole("status")).toHaveTextContent("Resume uploaded");
      expect(uploadResume).toHaveBeenCalledWith("t", pdf);
      expect(screen.getByText("Jordan_Lee_2026.pdf")).toBeInTheDocument();
      expect(screen.getByText("Uploaded Oct 27, 2026")).toBeInTheDocument();
      expect(screen.queryByText("Jordan_Lee_CV.pdf")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Upload resume" })).toBeDisabled();
    });

    it("lets a new applicant add their first resume", async () => {
      vi.mocked(uploadResume).mockResolvedValue({ fileName: "Jordan_Lee_2026.pdf", uploadDate: "2026-10-27T14:05:00" });
      show({ ...jordan, resume: null });

      choose(pdf, "Choose your resume");
      fireEvent.click(screen.getByRole("button", { name: "Upload resume" }));

      expect(await screen.findByText("Jordan_Lee_2026.pdf")).toBeInTheDocument();
      expect(screen.queryByText(/No resume on file yet/)).not.toBeInTheDocument();
    });

    it("shows the backend's reason for a refused file next to the field and keeps the resume on file (extension 6a)", async () => {
      const reason = "The file is not a PDF or DOCX. Choose a PDF or DOCX file of at most 5 MB.";
      vi.mocked(uploadResume).mockRejectedValue(new ResumeRefused(reason));
      show();

      choose(new File(["notes"], "notes.txt", { type: "text/plain" }));
      fireEvent.click(screen.getByRole("button", { name: "Upload resume" }));

      await screen.findByText(reason);
      expect(screen.getByLabelText("Replace your resume")).toHaveAccessibleDescription(reason);
      expect(screen.getByLabelText("Replace your resume")).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText("Replace your resume")).toHaveFocus();
      expect(screen.getByText("Jordan_Lee_CV.pdf")).toBeInTheDocument();
      expect(screen.queryByText("Resume uploaded")).not.toBeInTheDocument();
    });

    it("ends a session the backend refused", async () => {
      vi.mocked(uploadResume).mockRejectedValue(new SessionEnded());
      show();

      choose(pdf);
      fireEvent.click(screen.getByRole("button", { name: "Upload resume" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Your session has ended");
      expect(refresh).toHaveBeenCalled();
    });

    it("says when the upload failed and that the current resume is kept", async () => {
      vi.mocked(uploadResume).mockRejectedValue(new Error("Backend answered 500"));
      show();

      choose(pdf);
      fireEvent.click(screen.getByRole("button", { name: "Upload resume" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Unable to upload the resume. Your current resume is kept.");
      expect(screen.getByText("Jordan_Lee_CV.pdf")).toBeInTheDocument();
    });
  });
});
