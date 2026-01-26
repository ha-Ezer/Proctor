import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const distPath = join(__dirname, 'dist');

// Debug: Log directory info
console.log('Current directory:', __dirname);
console.log('Dist path:', distPath);
console.log('Dist exists:', existsSync(distPath));

if (existsSync(distPath)) {
  console.log('Dist contents:', readdirSync(distPath));
} else {
  console.error('ERROR: dist folder not found!');
}

// Serve static files from dist
app.use(express.static(distPath));

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('index.html not found. Build may have failed.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${PORT}`);
});
