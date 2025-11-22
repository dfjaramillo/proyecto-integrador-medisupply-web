const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
// Expose runtime config (no secrets stored in repo). Provide Google Maps API Key from env var.
app.get('/config.js', (req, res) => {
  const cfg = {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ''
  };
  // Prevent caching so rotations propagate quickly
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store');
  res.send('window.__APP_CONFIG = ' + JSON.stringify(cfg) + ';');
});

// Try to find the built Angular output folder inside dist/
function findDistFolder() {
  const baseDist = path.join(__dirname, 'dist');
  const expected = path.join(baseDist, 'medisupply-frontend');
  const expectedBrowser = path.join(expected, 'browser');
  // If localized build structure, use browser as base
  if (fs.existsSync(path.join(expectedBrowser, 'en')) || fs.existsSync(path.join(expectedBrowser, 'es'))) {
    console.log('Found localized browser folder:', expectedBrowser);
    return expectedBrowser;
  }
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
        if (stat.isDirectory()) {
          // check direct index.html
          if (fs.existsSync(path.join(candidate, 'index.html'))) {
            console.log('Found index.html in:', candidate);
            return candidate;
          }
          // recursive search (one level deep) in case build produced nested folder
          const subItems = fs.readdirSync(candidate);
          for (const sub of subItems) {
            const subCandidate = path.join(candidate, sub);
            try {
              const subStat = fs.statSync(subCandidate);
              if (subStat.isDirectory() && fs.existsSync(path.join(subCandidate, 'index.html'))) {
                console.log('Found index.html in nested folder:', subCandidate);
                return subCandidate;
              }
            } catch (e) {
              // ignore
            }
          }
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

// Attempt to detect localized build structure (Angular i18n output)
function findLocaleDirs(base) {
  const candidates = [];
  const directEs = path.join(base, 'es');
  const directEn = path.join(base, 'en');
  const browser = path.join(base, 'browser');
  const browserEs = path.join(browser, 'es');
  const browserEn = path.join(browser, 'en');

  [directEs, directEn, browserEs, browserEn].forEach(dir => {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      candidates.push(dir);
    }
  });
  return candidates;
}

let localeDirs = [];
if (distFolder) {
  localeDirs = findLocaleDirs(distFolder);
}
const hasLocales = localeDirs.length > 0;
let esDir = localeDirs.find(d => /[\\/]es$/.test(d)) || null;
let enDir = localeDirs.find(d => /[\\/]en$/.test(d)) || null;

if (hasLocales) {
  console.log('Localized build detected. Directories:', localeDirs);
  // Mount each locale directory under its locale prefix so relative asset URLs (base href /en/ or /es/) resolve.
  if (enDir) {
    app.use('/en', express.static(enDir));
  }
  if (esDir) {
    app.use('/es', express.static(esDir));
  }
} else if (distFolder) {
  // Fallback single build
  app.use(express.static(distFolder));
}

// Helper: pick locale from Accept-Language header; only es / en supported, default en
function negotiateLocale(req) {
  if (!hasLocales) return 'single';
  const accepted = req.acceptsLanguages ? req.acceptsLanguages('es', 'en') : null;
  const raw = (accepted || req.headers['accept-language'] || '').toLowerCase();
  if (raw.includes('es')) return 'es';
  return 'en';
}

// SPA fallback: serve proper index.html
// Locale specific SPA fallbacks: ensure deep routes under /en/* or /es/* return their own index
if (hasLocales) {
  if (enDir) {
    app.get('/en/*', (req, res) => res.sendFile(path.join(enDir, 'index.html')));
  }
  if (esDir) {
    app.get('/es/*', (req, res) => res.sendFile(path.join(esDir, 'index.html')));
  }
}

// Root fallback: negotiate Accept-Language only when not explicitly requesting a locale prefix
app.get('*', (req, res) => {
  if (!distFolder) {
    return res.status(500).send('Application not built. Run the build step to generate dist/.');
  }
  if (!hasLocales) {
    return res.sendFile(path.join(distFolder, 'index.html'));
  }
  // If path already starts with /en or /es, do nothing (handled above). This guards against overlap.
  if (/^\/(en|es)(\/|$)/.test(req.path)) {
    return res.status(404).send('Not found'); // Should have been handled; avoid serving wrong locale.
  }
  const locale = negotiateLocale(req);
  const dir = locale === 'es' ? esDir || enDir : enDir || esDir;
  if (!dir) {
    return res.status(500).send('Localized directories not found.');
  }
  return res.sendFile(path.join(dir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
