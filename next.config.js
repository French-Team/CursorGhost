/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Résoudre certains problèmes d'animation avec framer-motion
  compiler: {
    // ssr et displayName sont true par défaut
    styledComponents: true,
  },
}

module.exports = nextConfig 