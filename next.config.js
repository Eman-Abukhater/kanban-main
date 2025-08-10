/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["https://empoweringatt.ddns.net:4070"], // Add 'localhost' to the list of allowed domains
  },
};

module.exports = nextConfig;
