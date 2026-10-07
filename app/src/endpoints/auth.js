export const createAuthEndpoints = () => [
  {
    path: "/me",
    method: "GET",
    access: "private",
    handler: ({ auth }) => auth.session.data,
  },
];
