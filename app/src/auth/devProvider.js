// Stand-in for real login: every request is the same test applicant.
// When Log In is implemented, a provider that looks the token up in a
// session store replaces this file; nothing else changes.
const TEST_APPLICANT = {
  userId: "1",
  role: "Applicant",
  firstName: "Test",
  lastName: "Applicant",
  email: "test.applicant@example.com",
};

const devProvider = {
  async restoreSession() {
    return { token: "dev", data: TEST_APPLICANT, expiresAt: null };
  },
  async startSession(token, data) {
    return { token, data, expiresAt: null };
  },
  async endSession() {},
};

export default devProvider;
