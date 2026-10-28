import { fireEvent, render, screen } from "@testing-library/react";
import type { Profile } from "@/lib/api";
import ProfilePreview from "./ProfilePreview";

const jordan: Profile = {
  firstName: "Jordan",
  lastName: "Lee",
  email: "jordan.lee@example.com",
  phone: "(254) 555-0142",
  resume: { fileName: "Jordan_Lee_CV.pdf", uploadDate: "2026-10-01T09:30:00" },
};

describe("ProfilePreview", () => {
  it("shows the applicant's details from the backend (UC-03 steps 1–2)", () => {
    render(<ProfilePreview profile={jordan} />);

    expect(screen.getByLabelText("First name")).toHaveValue("Jordan");
    expect(screen.getByLabelText("Last name")).toHaveValue("Lee");
    expect(screen.getByLabelText("Email address")).toHaveValue("jordan.lee@example.com");
    expect(screen.getByLabelText("Phone number")).toHaveValue("(254) 555-0142");
  });

  it("shows the resume on file with its upload date", () => {
    render(<ProfilePreview profile={jordan} />);

    expect(screen.getByText("Jordan_Lee_CV.pdf")).toBeInTheDocument();
    expect(screen.getByText("Uploaded Oct 1, 2026")).toBeInTheDocument();
    expect(screen.queryByText(/Jordan_Lee_Resume/)).not.toBeInTheDocument();
  });

  it("says there is no resume yet when none is on file", () => {
    render(<ProfilePreview profile={{ ...jordan, phone: null, resume: null }} />);

    expect(screen.getByText(/No resume on file yet/)).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toHaveValue("");
  });

  it("says plainly that a change is not saved yet", () => {
    render(<ProfilePreview profile={jordan} />);

    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Jordy" } });
    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));

    expect(screen.getByRole("status")).toHaveTextContent("not saved");
  });
});
