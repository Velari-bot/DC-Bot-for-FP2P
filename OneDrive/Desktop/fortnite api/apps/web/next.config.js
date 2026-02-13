/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  },
  // Redirect Next.js routes to HTML files
  async redirects() {
    return [
      {
        source: '/',
        destination: '/index.html',
        permanent: false,
      },
      {
        source: '/docs',
        destination: '/docs.html',
        permanent: false,
      },
      {
        source: '/chat',
        destination: '/chat.html',
        permanent: false,
      },
      {
        source: '/tournaments',
        destination: '/tournaments.html',
        permanent: false,
      },
      {
        source: '/tweets',
        destination: '/tweets.html',
        permanent: false,
      },
      {
        source: '/tools/youtube-extractor',
        destination: '/tools/youtube-extractor.html',
        permanent: false,
      },
      {
        source: '/analyze',
        destination: '/analyze.html',
        permanent: false,
      },
      {
        source: '/masterclass',
        destination: '/masterclass.html',
        permanent: false,
      },
      {
        source: '/competitive-insights',
        destination: '/competitive-insights.html',
        permanent: false,
      },
      {
        source: '/nagc-dropmaps',
        destination: '/nagc-dropmaps.html',
        permanent: false,
      },
      {
        source: '/cih-coaching',
        destination: '/cih-coaching.html',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
