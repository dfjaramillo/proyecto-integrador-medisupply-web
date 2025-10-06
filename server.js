const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// The Angular build output goes to dist/medisupply-frontend (project name)
const distFolder = path.join(__dirname, 'dist', 'medisupply-frontend');
app.use(express.static(distFolder));

// SPA fallback: serve index.html for any unknown path
app.get('*', (req, res) => {
  res.sendFile(path.join(distFolder, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
