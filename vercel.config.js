/** @type {import('@vercel/build-utils').VercelConfig} */
module.exports = {
  builds: [
    {
      src: 'src/server.ts',
      use: '@vercel/node',
      config: {
        maxDuration: 30,
        includeFiles: [
          'src/config/config.yaml',
          'src/config/feeds.opml',
          'src/config/keywords.txt'
        ]
      }
    }
  ],
  env: {
    NODE_ENV: "production",
    VERCEL: "1"
  }
};