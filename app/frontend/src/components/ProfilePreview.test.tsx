import { fireEvent, render, screen } from "@testing-library/react";
import { ProfileRefused, SessionEnded, updateProfile, type Profile } from "@/lib/api";
import { clearSession, readSession, saveSession } from "@/lib/session";
import ProfilePreview from "./ProfilePreview";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  updateProfile: vi.fn(),
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
});
