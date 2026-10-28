import { render, screen } from "@testing-library/react";
import ResumeOnFile from "./ResumeOnFile";

describe("ResumeOnFile", () => {
  it("shows the resume on file with the day it was uploaded and offers to replace it", () => {
    render(<ResumeOnFile resume={{ fileName: "Jordan_Lee_Resume.pdf", uploadDate: "2026-09-30T14:00:00" }} />);

    expect(screen.getByText("Jordan_Lee_Resume.pdf")).toBeInTheDocument();
    expect(screen.getByText("Uploaded Sep 30, 2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Replace resume" })).toHaveAttribute("href", "/profile");
  });

  it("says there is none yet and offers to upload one", () => {
    render(<ResumeOnFile resume={null}>Not shown without a resume</ResumeOnFile>);

    expect(screen.getByText("No resume yet.")).toBeInTheDocument();
    expect(screen.queryByText("Not shown without a resume")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upload a resume" })).toHaveAttribute("href", "/profile");
  });
});
