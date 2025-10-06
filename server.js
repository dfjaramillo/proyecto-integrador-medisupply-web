const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Try to find the built Angular output folder inside dist/
function findDistFolder() {
  const baseDist = path.join(__dirname, 'dist');
  const expected = path.join(baseDist, 'medisupply-frontend');
  if (fs.existsSync(expected) && fs.existsSync(path.join(expected, 'index.html'))) {
    console.log('Found expected dist folder:', expected);
    return expected;
  }

  // If not found, check if dist/index.html exists
  if (fs.existsSync(path.join(baseDist, 'index.html'))) {
    console.log('Found index.html directly under dist');
    return baseDist;
  }

  // Otherwise, try to find any subfolder under dist that contains index.html
  try {
    const items = fs.readdirSync(baseDist);
    console.log('Contents of dist/:', items);
    for (const item of items) {
      const candidate = path.join(baseDist, item);
      try {
        const stat = fs.statSync(candidate);
        if (stat.isDirectory() && fs.existsSync(path.join(candidate, 'index.html'))) {
          console.log('Found index.html in:', candidate);
          return candidate;
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    console.log('Could not read dist directory:', e.message);
  }

  return null;
}

const distFolder = findDistFolder();
if (!distFolder) {
  console.error('No built Angular files found in dist/. Did the build run?');
}

if (distFolder) {
  app.use(express.static(distFolder));

  // SPA fallback: serve index.html for any unknown path
  app.get('*', (req, res) => {
    res.sendFile(path.join(distFolder, 'index.html'));
  });
} else {
  // Minimal route to show helpful message
  app.get('*', (req, res) => {
    res.status(500).send('Application not built. Run the build step to generate dist/.');
  });
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
