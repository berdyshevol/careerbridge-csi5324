/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ship the sample data files with the server code when deployed.
  outputFileTracingIncludes: {
    "/*": ["./data/**/*"],
  },
};

export default nextConfig;
