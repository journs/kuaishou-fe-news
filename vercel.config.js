/** @type {import('@vercel/build-utils').VercelConfig} */
module.exports = {
  functions: {
    "src/server.ts": {
      maxDuration: 30,
      // 确保包含配置文件
      includeFiles: [
        "config/**"
      ]
    }
  },
  env: {
    NODE_ENV: "production",
    VERCEL: "1"
  }
};