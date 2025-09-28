/** @type {import('next').NextConfig} */
const nextConfig = {
    // `output: 'export'` disables API routes. Remove it for local development
    // If you need static export for production builds, set this in CI or a
    // separate config used only for exporting.
    distDir: 'dist'
};

export default nextConfig;
