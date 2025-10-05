const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: serve index.html for any unknown path
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
