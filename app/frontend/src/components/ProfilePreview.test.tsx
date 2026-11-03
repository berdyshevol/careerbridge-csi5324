import { fireEvent, render, screen, within } from "@testing-library/react";
import { ProfileRefused, ResumeRefused, SessionEnded, updateProfile, uploadResume, type Profile } from "@/lib/api";
import { clearSession, readSession, saveSession } from "@/lib/session";
import ProfilePreview from "./ProfilePreview";

const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));
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

const FAILURE = "Something went wrong. Details saved before the error are kept, and your previous resume is still on file.";
const UPLOAD_FAILURE = "Something went wrong. Your previous resume is still on file.";

function show(profile: Profile = jordan) {
  render(<ProfilePreview profile={profile} token="t" />);
}

describe("ProfilePreview", () => {
  afterEach(() => {
    vi.mocked(updateProfile).mockReset();
    vi.mocked(uploadResume).mockReset();
    refresh.mockReset();
    push.mockReset();
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
    clearSession();
  });

  it("shows the applicant's details from the backend (UC-03 steps 1–2)", () => {
    show();

    expect(screen.getByRole("heading", { level: 1, name: "Profile and resume" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Details" })).toBeInTheDocument();
    expect(screen.getByLabelText("First name")).toHaveValue("Jordan");
    expect(screen.getByLabelText("Last name")).toHaveValue("Lee");
    expect(screen.getByLabelText("Email")).toHaveValue("jordan.lee@example.com");
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Your log-in. It cannot be changed here.");
    expect(screen.getByLabelText("Phone")).toHaveValue("(254) 555-0142");
    expect(screen.getByLabelText("Location")).toHaveValue("Waco, TX");
    expect(screen.getByLabelText("Headline")).toHaveValue("");
    expect(screen.getByLabelText("Skills")).toHaveValue("SQL, Python");
    expect(screen.getByLabelText("Work experience")).toHaveValue("");
  });

  it("shows the resume on file with its upload date and what a new one does", () => {
    show();

    expect(screen.getByRole("heading", { name: "Resume on file" })).toBeInTheDocument();
    expect(screen.getByText("Jordan_Lee_CV.pdf")).toBeInTheDocument();
    expect(screen.getByText("Uploaded Oct 1, 2026")).toBeInTheDocument();
    expect(screen.getByLabelText("Choose a file")).toHaveAccessibleDescription(
      "PDF or DOCX, up to 5 MB. It replaces the one above.",
    );
    expect(screen.getByText("Applications you already sent keep the resume they were sent with.")).toBeInTheDocument();
  });

  it("says there is no resume on file when none is", () => {
    show({ ...jordan, phone: null, resume: null });

    expect(screen.getByText("No resume on file.")).toBeInTheDocument();
    expect(screen.getByLabelText("Choose a file")).toHaveAccessibleDescription("PDF or DOCX, up to 5 MB.");
    expect(screen.queryByText(/Applications you already sent/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toHaveValue("");
  });

  it("saves every detail and says the profile is saved (UC-03 steps 3–4)", async () => {
    vi.mocked(updateProfile).mockResolvedValue({ ...jordan, phone: "(254) 555-0199", headline: "Data analyst" });
    show();

    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "(254) 555-0199" } });
    fireEvent.change(screen.getByLabelText("Headline"), { target: { value: "Data analyst" } });
    fireEvent.click(screen.getByRole("button", { name: "Save details" }));

    // Beside Save details, so a phone shows it where the applicant pressed
    expect(await within(screen.getByRole("form", { name: "Details" })).findByRole("status")).toHaveTextContent("Profile saved.");
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
    fireEvent.click(screen.getByRole("button", { name: "Save details" }));

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
    fireEvent.click(screen.getByRole("button", { name: "Save details" }));

    expect(await screen.findByText("Enter your first name.")).toBeInTheDocument();
    expect(screen.getByLabelText("First name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("First name")).toHaveFocus();
    expect(screen.getByLabelText("Phone")).toHaveAccessibleDescription("Enter a phone number like (254) 555-0142.");
    expect(screen.queryByText("Profile saved.")).not.toBeInTheDocument();
  });

  it("ends a session the backend refused", async () => {
    vi.mocked(updateProfile).mockRejectedValue(new SessionEnded());
    show();

    fireEvent.click(screen.getByRole("button", { name: "Save details" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Your session has ended");
    expect(refresh).toHaveBeenCalled();
  });

  it("says when the profile could not be saved (extension *a)", async () => {
    vi.mocked(updateProfile).mockRejectedValue(new Error("Backend answered 500"));
    show();

    fireEvent.click(screen.getByRole("button", { name: "Save details" }));

    expect(await within(screen.getByRole("form", { name: "Details" })).findByRole("alert")).toHaveTextContent(FAILURE);
  });

  it("does not speak of a resume on file when the save fails and there is none (extension *a)", async () => {
    vi.mocked(updateProfile).mockRejectedValue(new Error("Backend answered 500"));
    show({ ...jordan, resume: null });

    fireEvent.click(screen.getByRole("button", { name: "Save details" }));

    expect(await within(screen.getByRole("form", { name: "Details" })).findByRole("alert")).toHaveTextContent(
      /^Something went wrong\. Details saved before the error are kept\.$/,
    );
  });

  describe("uploading a resume (UC-03 steps 5–7)", () => {
    const pdf = new File(["%PDF-1.4"], "Jordan_Lee_2026.pdf", { type: "application/pdf" });

    function choose(file: File) {
      fireEvent.change(screen.getByLabelText("Choose a file"), { target: { files: [file] } });
    }

    it("uploads the chosen file at once and shows it in place of the previous one", async () => {
      vi.mocked(uploadResume).mockResolvedValue({ fileName: "Jordan_Lee_2026.pdf", uploadDate: "2026-10-27T14:05:00" });
      show();

      expect(screen.queryByRole("button", { name: /upload/i })).not.toBeInTheDocument();
      choose(pdf);

      expect(await screen.findByText("Jordan_Lee_2026.pdf")).toBeInTheDocument();
      expect(uploadResume).toHaveBeenCalledWith("t", pdf);
      expect(screen.getByText("Uploaded Oct 27, 2026")).toBeInTheDocument();
      expect(screen.queryByText("Jordan_Lee_CV.pdf")).not.toBeInTheDocument();
    });

    it("lets a new applicant add their first resume", async () => {
      vi.mocked(uploadResume).mockResolvedValue({ fileName: "Jordan_Lee_2026.pdf", uploadDate: "2026-10-27T14:05:00" });
      show({ ...jordan, resume: null });

      choose(pdf);

      expect(await screen.findByText("Jordan_Lee_2026.pdf")).toBeInTheDocument();
      expect(screen.queryByText("No resume on file.")).not.toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    });

    describe("coming from an application (UC-04 extensions 2a and 3a)", () => {
      function showFrom(next: string) {
        render(<ProfilePreview profile={{ ...jordan, resume: null }} token="t" next={next} />);
      }

      it("returns to the Apply page after the upload", async () => {
        vi.mocked(uploadResume).mockResolvedValue({ fileName: "Jordan_Lee_2026.pdf", uploadDate: "2026-10-27T14:05:00" });
        showFrom("/jobs/7/apply");

        choose(pdf);

        await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/jobs/7/apply"));
      });

      it("stays here when next names another site", async () => {
        vi.mocked(uploadResume).mockResolvedValue({ fileName: "Jordan_Lee_2026.pdf", uploadDate: "2026-10-27T14:05:00" });
        showFrom("//evil.example/jobs/7/apply");

        choose(pdf);

        expect(await screen.findByText("Jordan_Lee_2026.pdf")).toBeInTheDocument();
        expect(push).not.toHaveBeenCalled();
      });

      it("stays here when the file is refused", async () => {
        vi.mocked(uploadResume).mockRejectedValue(new ResumeRefused("The file is not a PDF or DOCX."));
        showFrom("/jobs/7/apply");

        choose(new File(["notes"], "notes.txt", { type: "text/plain" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("notes.txt was not uploaded.");
        expect(push).not.toHaveBeenCalled();
      });
    });

    it("names the refused file, states the accepted types and size, ties it to the field and keeps the resume on file (extension 6a)", async () => {
      vi.mocked(uploadResume).mockRejectedValue(new ResumeRefused("The file is not a PDF or DOCX."));
      show();

      choose(new File(["notes"], "notes.txt", { type: "text/plain" }));

      const refusal = "notes.txt was not uploaded. Use a PDF or DOCX file of 5 MB or less. Your current resume is still on file.";
      expect(await screen.findByRole("alert")).toHaveTextContent(refusal);
      const input = screen.getByLabelText("Choose a file");
      expect(input).toHaveAccessibleDescription(`PDF or DOCX, up to 5 MB. It replaces the one above. ${refusal}`);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveFocus();
      expect(screen.getByText("Jordan_Lee_CV.pdf")).toBeInTheDocument();
      // On a phone the alert is brought out from under the dock
      expect(screen.getByRole("alert").scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });

      // A later save clears the old refusal
      vi.mocked(updateProfile).mockResolvedValue(jordan);
      fireEvent.click(screen.getByRole("button", { name: "Save details" }));
      await screen.findByRole("status");
      expect(screen.queryByText("notes.txt was not uploaded.")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Choose a file")).not.toHaveAttribute("aria-invalid");
    });

    it("does not speak of a resume on file when there is none (extension 6a)", async () => {
      vi.mocked(uploadResume).mockRejectedValue(new ResumeRefused("The file is not a PDF or DOCX."));
      show({ ...jordan, resume: null });

      choose(new File(["notes"], "notes.txt", { type: "text/plain" }));

      const refusal = "notes.txt was not uploaded. Use a PDF or DOCX file of 5 MB or less.";
      expect(await screen.findByRole("alert")).toHaveTextContent(new RegExp(`^${refusal}$`));
      expect(screen.getByLabelText("Choose a file")).toHaveAccessibleDescription(`PDF or DOCX, up to 5 MB. ${refusal}`);
    });

    it("says it is uploading until the backend answers", async () => {
      let answer: (resume: { fileName: string; uploadDate: string }) => void = () => {};
      vi.mocked(uploadResume).mockReturnValue(new Promise((resolve) => (answer = resolve)));
      show();

      choose(pdf);

      expect(screen.getByLabelText("Choose a file")).toHaveAccessibleDescription("Uploading...");
      answer({ fileName: "Jordan_Lee_2026.pdf", uploadDate: "2026-10-27T14:05:00" });
      expect(await screen.findByText("Jordan_Lee_2026.pdf")).toBeInTheDocument();
    });

    it("ends a session the backend refused", async () => {
      vi.mocked(uploadResume).mockRejectedValue(new SessionEnded());
      show();

      choose(pdf);

      expect(await within(screen.getByRole("complementary")).findByRole("alert")).toHaveTextContent(
        "Your session has ended. Log in again to upload your resume.",
      );
      expect(refresh).toHaveBeenCalled();
    });

    it("says when the upload failed and that the previous resume is still on file (extension *a)", async () => {
      vi.mocked(uploadResume).mockRejectedValue(new Error("Backend answered 500"));
      show();

      choose(pdf);

      // Under the Resume card, where the applicant chose the file, not beside Save details
      expect(await within(screen.getByRole("complementary")).findByRole("alert")).toHaveTextContent(UPLOAD_FAILURE);
      expect(within(screen.getByRole("form", { name: "Details" })).queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByText("Jordan_Lee_CV.pdf")).toBeInTheDocument();
      expect(screen.getByRole("alert").scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
    });

    it("says only that the upload failed when no resume is on file (extension *a)", async () => {
      vi.mocked(uploadResume).mockRejectedValue(new Error("Backend answered 500"));
      show({ ...jordan, resume: null });

      choose(pdf);

      expect(await within(screen.getByRole("complementary")).findByRole("alert")).toHaveTextContent(
        /^Something went wrong\.$/,
      );
    });
  });
});
