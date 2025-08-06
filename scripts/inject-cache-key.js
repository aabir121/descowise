const fs = require('fs');
const path = require('path');

const swPath = path.resolve(__dirname, '../public/sw.js');
const cacheKey = process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString();

fs.readFile(swPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading sw.js:', err);
    return;
  }

  const updatedContent = data.replace('__CACHE_KEY_PLACEHOLDER__', cacheKey);

  fs.writeFile(swPath, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing sw.js:', err);
      return;
    }
    console.log(`Service Worker cache key updated to: ${cacheKey}`);
  });
});