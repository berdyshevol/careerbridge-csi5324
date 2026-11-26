import { render, screen, within } from "@testing-library/react";
import type { UserDirectory } from "@/lib/api";
import UserList from "./UserList";

const directory: UserDirectory = {
  usersByRole: { APPLICANT: 2, RECRUITER: 1, ADMINISTRATOR: 1 },
  users: [
    { userId: 1, firstName: "Avery", lastName: "Morgan", email: "admin@careerbridge.example", role: "ADMINISTRATOR", accountStatus: "ACTIVE", deactivated: false },
    { userId: 2, firstName: "Riley", lastName: "Chen", email: "riley.chen@example.com", role: "RECRUITER", accountStatus: "PENDING_VERIFICATION", deactivated: false },
    { userId: 3, firstName: "Jordan", lastName: "Lee", email: "jordan.lee@example.com", role: "APPLICANT", accountStatus: "ACTIVE", deactivated: false },
  ],
};

describe("UserList", () => {
  it("shows how many users each role has", () => {
    render(<UserList directory={directory} token="t" />);

    expect(within(screen.getByRole("list", { name: "Users by role" })).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "2 applicants",
      "1 recruiter",
      "1 administrator",
    ]);
  });

  it("shows each user's name, role, email and account status in the order given", () => {
    render(<UserList directory={directory} token="t" />);

    const rows = within(screen.getByRole("region", { name: "Users" })).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("Avery Morgan");
    expect(rows[0]).toHaveTextContent("Administrator");
    expect(rows[0]).toHaveTextContent("admin@careerbridge.example");
    expect(rows[0]).toHaveTextContent("Active");
    expect(rows[1]).toHaveTextContent("Recruiter");
    expect(rows[1]).toHaveTextContent("Pending verification");
    expect(rows[2]).toHaveTextContent("Applicant");
  });
});
