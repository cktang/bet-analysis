const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve pattern-discovery assets at root level
const patternDiscoveryDir = path.join(__dirname, '../src/pattern-discovery');
app.use('/', express.static(patternDiscoveryDir));

// Serve enhanced data files
const enhancedDataDir = path.join(__dirname, '../data/enhanced');
app.use('/data/enhanced', express.static(enhancedDataDir));

// Convenience redirect: factor-drilling-tool.html at root
app.get('/', (req, res) => {
  res.redirect('/factor-drilling-tool.html');
});

app.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
  console.log('Serving:');
  console.log(`  • /                  -> ${patternDiscoveryDir}`);
  console.log(`  • /data/enhanced     -> ${enhancedDataDir}`);
  console.log('');
  console.log(`Access the drilling tool at: http://localhost:${PORT}/factor-drilling-tool.html`);
}); 