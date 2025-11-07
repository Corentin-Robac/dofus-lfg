/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Turbopack à utiliser ce dossier comme racine
  turbopack: { root: __dirname },
};

module.exports = nextConfig;
